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
import { CamelDefinitionYaml } from "karavan-core/lib/api/CamelDefinitionYaml";
import { Integration } from "karavan-core/lib/model/IntegrationDefinition";

let builderPanel: vscode.WebviewPanel;
const filename = "application.properties";

export class BuilderView {

    constructor(private context: vscode.ExtensionContext, private webviewContent: string, private rootPath?: string) {

    }

    openProject() {
        // const yaml = fs.readFileSync(path.resolve(fullPath)).toString('utf8');
        // const filename = path.basename(fullPath);
        // const relativePath = utils.getRalativePath(fullPath);
        // const integration = utils.parceYaml(filename, yaml);

        // if (integration[0]) {
            this.openKaravanWebView();
        // } else {
        //     vscode.window.showErrorMessage("File is not Camel Integration!")
        // }
    }

    openKaravanWebView() {
        console.log("openKaravanWebView");
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
					}
				},
				undefined,
				this.context.subscriptions
			);
            // Handle close event
            builderPanel.onDidDispose(() => {
                // builderPanel.delete(relativePath);
            }, null, this.context.subscriptions);

            // Handle reopen
            builderPanel.onDidChangeViewState((e: vscode.WebviewPanelOnDidChangeViewStateEvent) => {
				if (e.webviewPanel.active) {
					e.webviewPanel.webview.postMessage({ command: 'reread' })
				}
			});
        } else {
            builderPanel?.reveal(undefined, true);
            builderPanel?.webview.postMessage({ command: 'activate'});
        }
    }

    sendData(page: string) {
		// Send data
		builderPanel.webview.postMessage({ command: 'open', page: page });
	}

}