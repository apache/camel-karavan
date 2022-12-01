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
import {Uri, window, commands, WebviewPanel, ExtensionContext, ViewColumn, WebviewPanelOnDidChangeViewStateEvent } from "vscode";
import * as path from "path";
import * as utils from "./utils";
import * as jbang from "./jbang";
import { CamelDefinitionYaml } from "core/api/CamelDefinitionYaml";
import { Integration } from "core/model/IntegrationDefinition";
import { getWebviewContent } from "./webviewContent";

const KARAVAN_LOADED = "karavan:loaded";
const KARAVAN_PANELS: Map<string, WebviewPanel> = new Map<string, WebviewPanel>();
const extension = '.properties';

export class DesignerView {

    constructor(private context: ExtensionContext, private rootPath?: string) {

    }

    karavanOpen(fullPath: string, tab?: string) {
        utils.readFile(path.resolve(fullPath)).then(readData => {
            const yaml = Buffer.from(readData).toString('utf8');
            const filename = path.basename(fullPath);
            const relativePath = utils.getRalativePath(fullPath);
            const integration = utils.parceYaml(filename, yaml);

            if (integration[0]) {
                this.openKaravanWebView(filename, relativePath, fullPath, integration[1], tab);
            } else {
                window.showErrorMessage("File is not Camel Integration!")
            }
        })
    }

    jbangRun(fullPath: string) {
        if (fullPath.startsWith('webview-panel/webview')) {
            const filename = this.getFilenameFromWebView();
            jbang.camelJbangRun(filename);
        } else {
            utils.readFile(path.resolve(fullPath)).then(readData => {
                const yaml = Buffer.from(readData).toString('utf8');
                const relativePath = utils.getRalativePath(fullPath);
                const filename = path.basename(fullPath);
                const integration = utils.parceYaml(filename, yaml);
                if (integration[0] && utils.getRoot() !== undefined) {
                    jbang.camelJbangRun(relativePath);
                } else {
                    window.showErrorMessage("File is not Camel Integration!")
                }
            });
        }
    }

    getFilenameFromWebView() {
        const filename = Array.from(KARAVAN_PANELS.entries()).filter(({ 1: v }) => v.active).map(([k]) => k)[0];
        if (filename && utils.getRoot() !== undefined) {
            return filename;
        }
    }

    createIntegration(type: 'crd' | 'plain' | 'kamelet', rootPath?: string) {
        window
            .showInputBox({
                title: type === 'crd' ? "Create Camel Integration CRD" : "Create Camel Integration YAML",
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
                    i.type = type;
                    const yaml = CamelDefinitionYaml.integrationToYaml(i);
                    const filename = name.toLocaleLowerCase().endsWith('.camel.yaml') ? name : name.split('.')[0] + '.camel.yaml';
                    const relativePath = (this.rootPath ? rootPath?.replace(this.rootPath, "") : rootPath) + path.sep + filename;
                    const fullPath = (rootPath ? rootPath : this.rootPath) + path.sep + filename;
                    utils.save(relativePath, yaml);
                    this.openKaravanWebView(filename, filename, fullPath, yaml);
                    commands.executeCommand('integrations.refresh');
                }
            });
    }

    openKaravanWebView(filename: string, relativePath: string, fullPath: string, yaml?: string, tab?: string) {
        if (!KARAVAN_PANELS.has(relativePath)) {
            // Karavan webview
            const panel = window.createWebviewPanel(
                "karavan",
                filename,
                ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        Uri.joinPath(this.context.extensionUri, "dist"),
                    ],
                }
            );
            panel.webview.html = getWebviewContent(this.context, panel.webview);
            panel.iconPath = Uri.joinPath(
                this.context.extensionUri,
                "icons/karavan.svg"
            );

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'save':
                            utils.save(message.relativePath, message.code);
                            break;
                        case 'saveCode':
                            console.log("saveCode")
                            utils.saveCode(message.name, message.yamlFullPath, message.yamFileName, message.code);
                            break;
                        case 'getData':
                            this.sendData(panel, filename, relativePath, fullPath, message.reread === true, yaml, tab);
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
            panel.onDidChangeViewState((e: WebviewPanelOnDidChangeViewStateEvent) => {
                if (e.webviewPanel.active) {
                    e.webviewPanel.webview.postMessage({ command: 'activate', tab: tab });
                } else {
                    e.webviewPanel.webview.postMessage({ command: 'deactivate' });
                }
            });

            KARAVAN_PANELS.set(relativePath, panel);
            commands.executeCommand("setContext", KARAVAN_LOADED, true);
        } else {
            const panel = KARAVAN_PANELS.get(relativePath);
            panel?.reveal(undefined, true);
            panel?.webview.postMessage({ command: 'activate', tab: tab });
        }
    }

    sendData(panel: WebviewPanel, filename: string, relativePath: string, fullPath: string, reread: boolean, yaml?: string, tab?: string) {
        Promise.all([
            // Read Kamelets
            utils.readKamelets(this.context),
            // Read components
            utils.readComponents(this.context),
            // Read templates
            utils.readTemplates(this.context),
            // Read java classes
            utils.readJavaCode(fullPath)
        ]).then(results => {
            // Send Kamelets
            panel.webview.postMessage({ command: 'kamelets', kamelets: results[0] });
            // Send components
            panel.webview.postMessage({ command: 'components', components: results[1] });
            // Send templates
            panel.webview.postMessage({ command: 'templates', templates: Object.fromEntries(results[2]) });
            // Send java code
            panel.webview.postMessage({ command: 'javaCode', javaCode: Object.fromEntries(results[3]) });
            // Send integration
            this.sendIntegrationData(panel, filename, relativePath, fullPath, reread, yaml, tab);
        }).catch(err => console.log(err));
    }

    sendIntegrationData(panel: WebviewPanel, filename: string, relativePath: string, fullPath: string, reread: boolean, yaml?: string, tab?: string) {
        // Read file if required
        if (reread) {
            utils.readFile(path.resolve(fullPath)).then(readData => {
                const yaml = Buffer.from(readData).toString('utf8');
                // Send integration
                panel.webview.postMessage({ command: 'open', page: "designer", filename: filename, relativePath: relativePath, fullPath:fullPath, yaml: yaml, tab: tab });
            });
        } else {
            // Send integration
            panel.webview.postMessage({ command: 'open', page: "designer", filename: filename, relativePath: relativePath, fullPath:fullPath, yaml: yaml, tab: tab });
        }

    }

    downloadImage(fullPath: string) {
        if (fullPath.startsWith('webview-panel/webview')) {
            const filename = this.getFilenameFromWebView();
            if (filename && KARAVAN_PANELS.has(filename)) {
                const panel = KARAVAN_PANELS.get(filename);
                panel?.webview.postMessage({ command: 'downloadImage' });
            }
        }
    }
}