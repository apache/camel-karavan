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
import { CamelYaml } from "../designer/api/CamelYaml";
import { CamelUi } from "../designer/api/CamelUi";
import * as jsyaml from 'js-yaml';
import { Integration } from "../designer/model/CamelModel";
import { homedir } from "os";

const KARAVAN_LOADED = "karavan:loaded";
const KARAVAN_PANELS: Map<any, string> = new Map<string, string>();
const TERMINALS: Map<string, vscode.Terminal> = new Map<string, vscode.Terminal>();

export function activate(context: vscode.ExtensionContext) {
    const webviewContent = fs
        .readFileSync(
            vscode.Uri.joinPath(context.extensionUri, "dist/index.html").fsPath,
            { encoding: "utf-8" }
        )
        .replace(
            "styleUri",
            vscode.Uri.joinPath(context.extensionUri, "/dist/main.css")
                .with({ scheme: "vscode-resource" })
                .toString()
        )
        .replace(
            "scriptUri",
            vscode.Uri.joinPath(context.extensionUri, "/dist/webview.js")
                .with({ scheme: "vscode-resource" })
                .toString()
        );

    // Create new Camel-K Integration CRD command
    const createCrd = vscode.commands.registerCommand("karavan.create-crd", () => createIntegration(context, webviewContent, true));
    context.subscriptions.push(createCrd);

    // Create new Camel Integration YAML command
    const createYaml = vscode.commands.registerCommand("karavan.create-yaml", () => createIntegration(context, webviewContent, false));
    context.subscriptions.push(createYaml);

    // Open Camel-K integration in designer
    const open = vscode.commands.registerCommand(
        "karavan.open",
        (...args: any[]) => {
            if (args && args.length > 0) {
                const yaml = fs.readFileSync(path.resolve(args[0].path)).toString('utf8');
                const filename = path.basename(args[0].path);
                const integration = parceYaml(filename, yaml);
                if (integration[0]) {
                    openKaravanWebView(context, webviewContent, filename || '', integration[1]);
                } else {
                    vscode.window.showErrorMessage("File is not Camel Integration!")
                }
            }
        }
    );
    context.subscriptions.push(open);

    // Run Camel-K integration in designer
    const run = vscode.commands.registerCommand(
        "karavan.jbang-run",
        (...args: any[]) => {
            if (args && args.length > 0) {
                if (args[0].path.startsWith('webview-panel/webview')) {
                    const filename = KARAVAN_PANELS.get(args[0].path);
                    if (filename) {
                        runCamelJbang(filename);
                    }
                } else {
                    const yaml = fs.readFileSync(path.resolve(args[0].path)).toString('utf8');
                    const filename = path.basename(args[0].path);
                    const integration = parceYaml(filename, yaml);
                    if (integration[0]) {
                        runCamelJbang(filename);
                    } else {
                        vscode.window.showErrorMessage("File is not Camel-K Integration!")
                    }
                }
            }
        }
    );
    context.subscriptions.push(run);
}

function openKaravanWebView(context: vscode.ExtensionContext, webviewContent: string, filename: string, yaml?: string) {
    // Karavan webview
    const panel = vscode.window.createWebviewPanel(
        "karavan",
        filename,
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
    panel.webview.postMessage({ command: 'kamelets', kamelets: readKamelets(context) });

    // Read and send Components
    panel.webview.postMessage({ command: 'components', components: readComponents(context) });

    // Send integration
    panel.webview.postMessage({ command: 'open', filename: filename, yaml: yaml });


    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'save':
                    if (vscode.workspace.workspaceFolders) {
                        const uriFolder: vscode.Uri = vscode.workspace.workspaceFolders[0].uri;
                        const uriFile: vscode.Uri = vscode.Uri.file(path.join(uriFolder.path, message.filename));
                        fs.writeFile(uriFile.path, message.yaml, err => {
                            if (err) vscode.window.showErrorMessage("Error: " + err?.message);
                        });
                    }
                    return;
                case 'url-mapping':
                    KARAVAN_PANELS.set('webview-panel/webview-' + message.pathId, message.filename);
            }
        },
        undefined,
        context.subscriptions
    );
    vscode.commands.executeCommand("setContext", KARAVAN_LOADED, true);
}

function createIntegration(context: vscode.ExtensionContext, webviewContent: string, crd: boolean) {
    vscode.window
        .showInputBox({
            title: crd ? "Create Camel-K Integration CRD" : "Create Camel Integration YAML",
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
                const name = CamelUi.nameFromTitle(value);
                const i = Integration.createNew(name);
                i.crd = crd;
                const yaml = CamelYaml.integrationToYaml(i);
                openKaravanWebView(context, webviewContent, name + '.yaml', yaml);
            }
        });
}

function readKamelets(context: vscode.ExtensionContext): string[] {
    const dir = path.join(context.extensionPath, 'kamelets');
    const yamls: string[] = fs.readdirSync(dir).filter(file => file.endsWith("yaml")).map(file => fs.readFileSync(dir + "/" + file, 'utf-8'));
    try {
        const kameletsPath:string = vscode.workspace.getConfiguration().get("Karavan.kameletsPath") || '';
        const kameletsDir = path.isAbsolute(kameletsPath) ? kameletsPath : path.resolve(kameletsPath);
        const customKamelets: string[] = fs.readdirSync(kameletsDir).filter(file => file.endsWith("yaml")).map(file => fs.readFileSync(kameletsDir + "/" + file, 'utf-8'));
        if (customKamelets && customKamelets.length > 0) yamls.push(...customKamelets);
    } catch(e) {

    }
    return yamls;
}

function readComponents(context: vscode.ExtensionContext): string[] {
    const dir = path.join(context.extensionPath, 'components');
    const jsons: string[] = fs.readdirSync(dir).filter(file => file.endsWith("json")).map(file => fs.readFileSync(dir + "/" + file, 'utf-8'));
    return jsons;
}

function parceYaml(filename: string, yaml: string): [boolean, string?] {
    const i = CamelYaml.yamlToIntegration(filename, yaml);
    if (i.kind === 'Integration' && i.metadata.name) {
        return [true, yaml];
    } else {
        return [false, undefined];
    }
}

function runCamelJbang(filename: string) {
    const version = vscode.workspace.getConfiguration().get("CamelJBang.version");
    const maxMessages = vscode.workspace.getConfiguration().get("CamelJBang.maxMessages");
    const loggingLevel = vscode.workspace.getConfiguration().get("CamelJBang.loggingLevel");
    const reload = vscode.workspace.getConfiguration().get("CamelJBang.reload");
    const command = "jbang -Dcamel.jbang.version=" + version + " CamelJBang@apache/camel run " + filename 
            + " --max-messages=" + maxMessages 
            + " --logging-level=" + loggingLevel
            + (reload ? " --reload" : "");
    const existTerminal = TERMINALS.get(filename);
    if (existTerminal) existTerminal.dispose();
    const terminal = vscode.window.createTerminal('CamelJBang: ' + filename);
    TERMINALS.set(filename, terminal);
    terminal.show();
    terminal.sendText(command);
}

export function deactivate() {
    vscode.commands.executeCommand("setContext", KARAVAN_LOADED, false);
}
