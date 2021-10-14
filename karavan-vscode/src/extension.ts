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
import {CamelYaml} from "../designer/api/CamelYaml";

export function activate(context: vscode.ExtensionContext) {
    const webviewContent = fs
        .readFileSync(
            vscode.Uri.joinPath(context.extensionUri, "dist/index.html").fsPath,
            {encoding: "utf-8"}
        )
        .replace(
            "styleUri",
            vscode.Uri.joinPath(context.extensionUri, "/dist/main.css")
                .with({scheme: "vscode-resource"})
                .toString()
        )
        .replace(
            "scriptUri",
            vscode.Uri.joinPath(context.extensionUri, "/dist/webview.js")
                .with({scheme: "vscode-resource"})
                .toString()
        );

    // Create new Camel-K Integration command
    const create = vscode.commands.registerCommand(
        "karavan.create",
        () => {
            vscode.window
                .showInputBox({
                    title: "Create Integration",
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
                    if (value) openKaravanWebView(context, webviewContent, value || '', undefined);
            });
        }
    );

    // Open Camel-K integration in designer
    const open = vscode.commands.registerCommand(
        "karavan.open",
        (...args: any[]) => {
            if (args && args.length >0){
                const yaml = fs.readFileSync(path.resolve(args[0].path)).toString('utf8');
                const parce = isIntegration(yaml);
                if (parce[0]){
                    openKaravanWebView(context, webviewContent, parce[1] || '', yaml);
                } else {
                    vscode.window.showErrorMessage("File is not Camel-K Integration!")
                }
            }
        }
    );
    context.subscriptions.push(create);
    context.subscriptions.push(open);
}

function openKaravanWebView(context: vscode.ExtensionContext, webviewContent: string, name: string, yaml?:string) {
    // Karavan webview
    const panel = vscode.window.createWebviewPanel(
        "karavan",
        "Karavan",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, "dist"),
            ],
        }
    );

    panel.webview.html = webviewContent;
    panel.iconPath = vscode.Uri.joinPath(
        context.extensionUri,
        "icons/icon.svg"
    );

    // Read and send Kamelets
    panel.webview.postMessage({command: 'kamelets', kamelets: readKamelets(context)});

    // Read and send Components
    panel.webview.postMessage({command: 'components', components: readComponents(context)});

    // Send integration
    panel.webview.postMessage({command: 'open', name: name, yaml: yaml});


    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'save':
                    if (vscode.workspace.workspaceFolders){
                        const uriFolder: vscode.Uri =  vscode.workspace.workspaceFolders[0].uri;
                        const uriFile: vscode.Uri = vscode.Uri.file(path.join(uriFolder.path, message.name + '.yaml'));
                        fs.writeFile(uriFile.path, message.yaml, err => {
                            if (err) vscode.window.showErrorMessage("Error: " + err?.message);
                        });
                    }
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
}

function readKamelets(context: vscode.ExtensionContext): string[] {
    const dir = path.join(context.extensionPath, 'kamelets');
    const yamls: string[] = fs.readdirSync(dir).filter(file => file.endsWith("yaml")).map(file => fs.readFileSync(dir + "/" + file, 'utf-8'));
    return yamls;
}

function readComponents(context: vscode.ExtensionContext): string[] {
    const dir = path.join(context.extensionPath, 'components');
    const jsons: string[] = fs.readdirSync(dir).filter(file => file.endsWith("json")).map(file => fs.readFileSync(dir + "/" + file, 'utf-8'));
    console.log(jsons)
    return jsons;
}

function isIntegration(yaml: string): [boolean, string?] {
    const i = CamelYaml.yamlToIntegration(yaml);
    if (i.kind === 'Integration' && i.metadata.name){
        return [true, i.metadata.name];
    } else {
        return [false, undefined];
    }
}

export function deactivate() {
}
