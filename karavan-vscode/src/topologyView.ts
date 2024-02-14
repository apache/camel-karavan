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
import * as utils from "./utils";
import * as path from "path";
import { getWebviewContent } from "./webviewContent";
import { WebviewPanelOnDidChangeViewStateEvent } from "vscode";

const page = 'topology';

const KARAVAN_PANELS: Map<string, vscode.WebviewPanel> = new Map<string, vscode.WebviewPanel>();

export class TopologyView {

	constructor(private context: vscode.ExtensionContext) {

	}

	openKaravanWebView(fsPath: string | undefined) {
		if (!KARAVAN_PANELS.has(page)) {
			// Karavan webview
			const panel = vscode.window.createWebviewPanel(
				"karavan",
				"Topology",
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [
						vscode.Uri.joinPath(this.context.extensionUri, "dist"),
					],
				}
			);
			panel.webview.html = getWebviewContent(this.context, panel.webview);
			panel.iconPath = vscode.Uri.joinPath(
				this.context.extensionUri,
				"icons/karavan.svg"
			);

			// Handle messages from the webview
			panel.webview.onDidReceiveMessage(
				message => {
					switch (message.command) {
						case 'getData':
							this.sendData(panel, fsPath);
							break;
						case 'openFile':
							this.openFile(fsPath, message.fileName);
							break;
					}
				},
				undefined,
				this.context.subscriptions
			);
			// Handle close event
			panel.onDidDispose(() => {
				KARAVAN_PANELS.delete(page);
			}, null, this.context.subscriptions);

			// Handle reopen
            panel.onDidChangeViewState((e: WebviewPanelOnDidChangeViewStateEvent) => {
                if (e.webviewPanel.active) {
                    e.webviewPanel.webview.postMessage({ command: 'activate'});
                } else {
                    e.webviewPanel.webview.postMessage({ command: 'deactivate' });
                }
            });

			KARAVAN_PANELS.set(page, panel);
		} else {
			KARAVAN_PANELS.get(page)?.reveal(undefined, true);
		}
	}

	sendData(panel: vscode.WebviewPanel, fsPath: string | undefined) {
		if (fsPath) {
			// Read and send Kamelets
			utils.readKamelets(this.context).then(kamelets => {
				panel.webview.postMessage({ command: 'kamelets', kamelets: kamelets });
			}).finally(() => {
				utils.readComponents(this.context).then(components => {
					// Read and send Components
					panel.webview.postMessage({ command: 'components', components: components });
				}).finally(() => {
					// Read and send Integrations
					const dir = fsPath.endsWith('camel.yaml') ? path.dirname(fsPath) : fsPath;
					utils.readCamelYamlFiles(dir).then((files) => {
						panel.webview.postMessage({ command: 'files', files: files });
					}).finally(() => {
						// Open
						panel.webview.postMessage({ command: 'open', page: page });
					})
				})
			})
		}
	}

	openFile(fsPath: string | undefined, fileName: string) {
		const fullPath = fsPath + path.sep + fileName;
		vscode.commands.executeCommand("karavan.open", { fsPath: fullPath })
	}
}
