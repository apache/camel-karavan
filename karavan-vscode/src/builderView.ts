/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as utils from "./utils";
import * as commands from "./commands";
import { ProjectModel, StepStatus, Profile } from "karavan-core/lib/model/ProjectModel";
import { ProjectModelApi } from "karavan-core/lib/api/ProjectModelApi";

let builderPanel: vscode.WebviewPanel | undefined;
const extension = '.properties';

export class BuilderView {

    constructor(private context: vscode.ExtensionContext, private webviewContent: string, private rootPath?: string) {

    }

    openProject() {
        if (builderPanel === undefined) {
            // Karavan webview
            builderPanel = vscode.window.createWebviewPanel(
                "karavan",
                "Builder",
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(this.context.extensionUri, "dist"),
                    ],
                }
            );
            builderPanel.webview.html = this.webviewContent;
            builderPanel.iconPath = vscode.Uri.joinPath(
                this.context.extensionUri,
                "icons/karavan.svg"
            );

            // Handle messages from the webview
            builderPanel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'getData':
                            this.sendData("builder");
                            break;
                        case 'saveProfiles':
                            this.saveProfiles(message.profiles);
                            break;
                        case 'action':
                            this.actionProfile(message.action, message.profile);
                            break;
                    }
                },
                undefined,
                this.context.subscriptions
            );
            // Handle close event
            builderPanel.onDidDispose(() => {
                builderPanel = undefined;
                console.log("dispose");
            }, null, this.context.subscriptions);

            // Handle reopen
            builderPanel.onDidChangeViewState((e: vscode.WebviewPanelOnDidChangeViewStateEvent) => {
                if (e.webviewPanel.active) {
                    e.webviewPanel.webview.postMessage({ command: 'reread' })
                }
            });
        } else {
            builderPanel?.reveal(undefined, true);
            builderPanel?.webview.postMessage({ command: 'activate' });
        }
    }

    sendData(page: string) {
        builderPanel?.webview.postMessage({ command: 'open', page: page });
        if (this.rootPath) {
            const profiles = this.readProfiles(this.rootPath);
            const files = this.readFiles(this.rootPath);
            console.log("profiles", profiles);
            // Send data
            builderPanel?.webview.postMessage({ command: 'profiles', files: files, profiles: profiles });
        }
    }

    actionProfile(action: "start" | "stop" | "undeploy", profile: Profile) {
        switch (action) {
            case "start": this.start(profile); break;
            case "stop": { }; break;
            case "undeploy": this.undelpoy(profile); break;
        }
    }

    start(profile: Profile) {
        const files = this.readFiles(this.rootPath || '');
        const project = profile.project;
        project.status.active = true;
        project.status.uberJar = new StepStatus()
        project.status.build = new StepStatus()
        project.status.deploy = new StepStatus()
        project.status.undeploy = new StepStatus()
        if (project.uberJar) {
            project.status.uberJar = StepStatus.progress();
            builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
            this.package(project, files);
        } else if (project.build) {
            project.status.uberJar.status = "done";
            this.buildImage(project, files);
        }
    }

    package(project: ProjectModel, files: string) {
        console.log("package", project);
        project.status.uberJar = StepStatus.progress();
        builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });

        commands.camelJbangPackage(this.rootPath || "", code => {
            project.status.uberJar = code === 0 ? StepStatus.done(project.status.uberJar) : StepStatus.error(project.status.uberJar);
            builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
            if (code === 0 && project.build) {
                this.buildImage(project, files);
            } else {
                this.finish(project, files, code);
            }
        });
    }

    buildImage(project: ProjectModel, files: string) {
        console.log("buildImage", project);
        project.status.build = StepStatus.progress();
        builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });

        commands.camelJbangBuildImage(this.rootPath || "", project, code => {
            project.status.build = code === 0 ? StepStatus.done(project.status.build) : StepStatus.error(project.status.build);
            builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
            if (code === 0 && project.deploy) {
                this.deploy(project, files);
            } else {
                this.finish(project, files, code);
            }
        });
    }

    deploy(project: ProjectModel, files: string) {
        console.log("deploy", project);
        project.status.deploy = StepStatus.progress();
        builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });

        commands.camelJbangDeploy(this.rootPath || "", project, code => {
            project.status.deploy = code === 0 ? StepStatus.done(project.status.deploy) : StepStatus.error(project.status.deploy);
            builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
            this.finish(project, files, code);
        });
    }


    finish(project: ProjectModel, files: string, code: number) {
        console.log("finish", project);
        if (project.cleanup) commands.cleanup(this.rootPath || "", project, () => { })
        setTimeout(() => {
            project.status.active = false;
            builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
        }, 1000);
    }

    saveProfiles(profiles: Profile[]) {
        profiles.forEach(profile => {
            const filename = profile.name + extension;
            let properties = ''
            try {
                properties = fs.readFileSync(path.resolve(this.rootPath || '', filename)).toString('utf8');
            } catch (err: any) {
                if (err.code !== 'ENOENT') throw err;
                vscode.window.showErrorMessage(err);
            }
            const newProperties = ProjectModelApi.updateProperties(properties, profile.project);
            utils.save(filename, newProperties);
        });
        const rootPath = this.rootPath;
        const profileNames = profiles.map(p => p.name);
        if (rootPath){
            const currentProfiles = this.readProfiles(rootPath);
            currentProfiles.filter(p => !profileNames.includes(p.name)).forEach(p => {
                fs.rmSync(path.resolve(rootPath, p.name + extension))
            });
        }
    }

    readFiles(rootPath: string): string {
        return utils.getAllFiles(rootPath, []).map(f => utils.getRalativePath(f)).join(",");
    }

    readProfiles(rootPath: string): Profile[] {
        const profiles: Profile[] = [];
        fs.readdirSync(rootPath).filter(f => f.endsWith(extension)).forEach(file => {
            const name = path.basename(file).replace(extension, "");
            try {
                let project = ProjectModel.createNew();
                const properties = fs.readFileSync(path.resolve(rootPath, file)).toString('utf8');
                project = ProjectModelApi.propertiesToProject(properties);
                profiles.push(new Profile({name, project}));
            } catch (err: any) {
                if (err.code !== 'ENOENT') throw err;
                console.log(err)
            }
        })
        return profiles;
    }

    undelpoy(profile: Profile) {
        const files = this.readFiles(this.rootPath || '');
        const project = profile.project;
        console.log("undelpoy", project);
        project.status.active = true;
        project.status.undeploy = StepStatus.progress();
        builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
        commands.camelJbangUndeploy(this.rootPath || '', project, (code) => this.finish(project, files, code));
    }
}
