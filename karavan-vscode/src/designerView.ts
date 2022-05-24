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
import { CamelDefinitionYaml } from "karavan-core/lib/api/CamelDefinitionYaml";
import { Integration } from "karavan-core/lib/model/IntegrationDefinition";

const KARAVAN_LOADED = "karavan:loaded";
const KARAVAN_PANELS: Map<string, vscode.WebviewPanel> = new Map<string, vscode.WebviewPanel>();
const extension = '.properties';

export class DesignerView {

    constructor(private context: vscode.ExtensionContext, private webviewContent: string, private rootPath?: string) {

    }

    karavanOpen(fullPath: string, tab?: string) {
        const yaml = fs.readFileSync(path.resolve(fullPath)).toString('utf8');
        const filename = path.basename(fullPath);
        const relativePath = utils.getRalativePath(fullPath);
        const integration = utils.parceYaml(filename, yaml);

        if (integration[0]) {
            this.openKaravanWebView(filename, relativePath, fullPath, integration[1], tab);
        } else {
            vscode.window.showErrorMessage("File is not Camel Integration!")
        }
    }

    jbangRun(fullPath: string) {
        const filename = this.getFilename(fullPath);
        if (filename && this.rootPath){
            this.selectProfile(this.rootPath, filename);
        }        
    }

    getFilename(fullPath: string) {
        if (fullPath.startsWith('webview-panel/webview')) {
            const filename = Array.from(KARAVAN_PANELS.entries()).filter(({ 1: v }) => v.active).map(([k]) => k)[0];
            if (filename && this.rootPath) {
                return filename;
            }
        } else {
            const yaml = fs.readFileSync(path.resolve(fullPath)).toString('utf8');
            const relativePath = utils.getRalativePath(fullPath);
            const filename = path.basename(fullPath);
            const integration = utils.parceYaml(filename, yaml);
            if (integration[0] && this.rootPath) {
                return relativePath;
            } else {
                vscode.window.showErrorMessage("File is not Camel Integration!")
            }
        }
    }

    selectProfile(rootPath: string, filename?: string) {
        if (this.rootPath) {
            const profiles: string [] = fs.readdirSync(this.rootPath).filter(f => f.endsWith(extension)).map(file => path.basename(file).replace(extension, ""));
            if (profiles && profiles.length > 0){
                vscode.window.showQuickPick(profiles).then((profile) => {
                    if (!profile) {
                        return
                    } else {
                        commands.camelJbangRun(rootPath, profile, filename);
                    }
                })
            } else {
                commands.camelJbangRun(rootPath, "application", filename);
            }
        }
    }

    createIntegration(crd: boolean, rootPath?: string) {
        vscode.window
            .showInputBox({
                title: crd ? "Create Camel Integration CRD" : "Create Camel Integration YAML",
                ignoreFocusOut: true,
                prompt: "Integration name",
                validateInput: (text: string): string | undefined => {
                    if (!text || text.length === 0) {
                        return 'Name should not be empty';
                    } else {
                        return undefined;
                    }
                }
            }).then(value => {
                if (value) {
                    const name = utils.nameFromTitle(value);
                    const i = Integration.createNew(name);
                    i.crd = crd;
                    const yaml = CamelDefinitionYaml.integrationToYaml(i);
                    const filename = name.toLocaleLowerCase().endsWith('.yaml') ? name : name + '.yaml';
                    const relativePath = (this.rootPath ? rootPath?.replace(this.rootPath, "") : rootPath) + path.sep + filename;
                    const fullPath =  (rootPath ? rootPath : this.rootPath) + path.sep + filename;
                    utils.save(relativePath, yaml);
                    this.openKaravanWebView(filename, filename, fullPath, yaml);
                    vscode.commands.executeCommand('integrations.refresh');
                }
            });
    }

    openKaravanWebView(filename: string, relativePath: string, fullPath: string,  yaml?: string, tab?: string) {
        console.log("openKaravanWebView");
        if (!KARAVAN_PANELS.has(relativePath)) {
            // Karavan webview
            const panel = vscode.window.createWebviewPanel(
                "karavan",
                filename,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(this.context.extensionUri, "dist"),
                    ],
                }
            );
            panel.webview.html = this.webviewContent;
            panel.iconPath = vscode.Uri.joinPath(
                this.context.extensionUri,
                "icons/karavan.svg"
            );

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'save':
                            console.log("save", message);
                            utils.save(message.relativePath, message.yaml);
                            break;
                        case 'getData':
                            this.sendData(panel, filename, relativePath, fullPath, message.reread === true, yaml, tab);
                            break;
                        case 'disableStartHelp':
                            utils.disableStartHelp();
                            break;    
                    }
                },
                undefined,
                this.context.subscriptions
            );
            // Handle close event
            panel.onDidDispose(() => {
                KARAVAN_PANELS.delete(relativePath);
            }, null, this.context.subscriptions);

            // Handle reopen
            panel.onDidChangeViewState((e: vscode.WebviewPanelOnDidChangeViewStateEvent) => {
                console.log(e);
                if (e.webviewPanel.active || e.webviewPanel.reveal) {
                    e.webviewPanel.webview.postMessage({ command: 'activate', tab: tab });
                } else {
                    e.webviewPanel.webview.postMessage({ command: 'deactivate' });
                }
            });

            KARAVAN_PANELS.set(relativePath, panel);
            vscode.commands.executeCommand("setContext", KARAVAN_LOADED, true);
        } else {
            const panel = KARAVAN_PANELS.get(relativePath);
            panel?.reveal(undefined, true);
            panel?.webview.postMessage({ command: 'activate', tab: tab });
        }
    }

    sendData(panel: vscode.WebviewPanel, filename: string, relativePath: string, fullPath: string, reread: boolean, yaml?: string, tab?: string) {

        // Read and send Kamelets
        panel.webview.postMessage({ command: 'kamelets', kamelets: utils.readKamelets(this.context) });

        // Read and send Components
        panel.webview.postMessage({ command: 'components', components: utils.readComponents(this.context) });

        // Send showStartHelp
        const showStartHelp = vscode.workspace.getConfiguration().get("Karavan.showStartHelp");
        panel.webview.postMessage({ command: 'showStartHelp', showStartHelp: showStartHelp});

        // Read file if required
        if (reread){
            yaml = fs.readFileSync(path.resolve(fullPath)).toString('utf8');
        }
        // Send integration
        panel.webview.postMessage({ command: 'open', page: "designer", filename: filename, relativePath: relativePath, yaml: yaml, tab: tab });
    }

}