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
import { ProjectModel } from "karavan-core/lib/model/ProjectModel";
import { ProjectModelApi } from "karavan-core/lib/api/ProjectModelApi";

let builderPanel: vscode.WebviewPanel | undefined;
const filename = "application.properties";

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
                        case 'saveProject':
                            this.saveProject(message.project);
                            break;
                        case 'action':
                            this.actionProject(message.action, message.project);
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
        console.log(this.rootPath);
        if (this.rootPath) {
            const [project, files] = this.readProjectInfo(this.rootPath);
            // Send data
            builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
        }
    }

    actionProject(action: "start" | "stop" | "undeploy", project: ProjectModel) {
        switch (action){
            case "start" : this.start(project); break;
            case "stop" : {}; break;
            case "undeploy" : this.undelpoy(project); break;
        }
    }

    start(project: ProjectModel) {
        const [x, files] = this.readProjectInfo(this.rootPath || '');
        project.status.active = true;
        project.status.uberJar = "pending";
        project.status.build = "pending";
        project.status.deploy = "pending";
        project.status.undeploy = "pending";
        if (project.uberJar) {
            project.status.uberJar = "progress";
            builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
            this.package(project, files);
        }
    }

    package(project: ProjectModel, files: string) {
        console.log("package", project);
        project.status.uberJar = "progress";
        builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });

        commands.camelJbangPackage(this.rootPath || "", code => {
            project.status.uberJar = code === 0 ? "done" : "error";
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
        project.status.build = "progress";
        builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });

        commands.camelJbangBuildImage(this.rootPath || "", project,  code => {
            project.status.build = code === 0 ? "done" : "error";
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
        project.status.deploy = "progress";
        builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });

        commands.camelJbangDeploy(this.rootPath || "", project, code => {
            project.status.deploy = code === 0 ? "done" : "error";
            builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
            this.finish(project, files, code);
        });
    }


    finish(project: ProjectModel, files: string,  code: number) {
        console.log("finish", project);
        if (project.cleanup) commands.cleanup(this.rootPath || "", project, () => {})
        setTimeout(() => {
            project.status.active = false;
            builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
        }, 1000);
    }

    saveProject(project: ProjectModel) {
        let properties = ''
        try {
            properties = fs.readFileSync(path.resolve(this.rootPath || '', filename)).toString('utf8');
        } catch (err: any) {
            if (err.code !== 'ENOENT') throw err;
        }
        const newProperties = ProjectModelApi.updateProperties(properties, project);
        utils.save(filename, newProperties);
    }

    readProjectInfo(rootPath: string): [ProjectModel, string] {
        const files = utils.getAllFiles(rootPath, []).map(f => utils.getRalativePath(f)).join(",");
        let project = ProjectModel.createNew();
        try {
            const properties = fs.readFileSync(path.resolve(rootPath, filename)).toString('utf8');
            project = ProjectModelApi.propertiesToProject(properties);
        } catch (err: any) {
            if (err.code !== 'ENOENT') throw err;
        }
        return [project, files];
    }

    undelpoy(project: ProjectModel) {
        const [x, files] = this.readProjectInfo(this.rootPath || '');
        console.log("undelpoy", project);
        project.status.active = true;
        project.status.undeploy = "progress";
        builderPanel?.webview.postMessage({ command: 'project', files: files, project: project });
        commands.camelJbangUndeploy(this.rootPath || '', project, (code) => this.finish(project, files, code));
    }
}
