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
import vscode, { window } from 'vscode';
import * as fs from "fs";
import { DesignerView } from "./designerView";
import { IntegrationView } from "./integrationView";
import { HelpView } from "./helpView";
import { selectFileName, inputFileName, OpenApiView, OpenApiItem } from "./openapiView";
import * as path from "path";
import * as commands from "./commands";
import * as utils from "./utils";

const KARAVAN_LOADED = "karavan:loaded";

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

    const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

    // Register views    
    const designer = new DesignerView(context, webviewContent, rootPath);

    const integrationView = new IntegrationView(designer, rootPath);
    vscode.window.registerTreeDataProvider('integrations', integrationView);
    vscode.commands.registerCommand('integrations.refresh', () => integrationView.refresh());

    const openapiView = new OpenApiView(designer, rootPath);
    vscode.window.registerTreeDataProvider('openapi', openapiView);
    vscode.commands.registerCommand('openapi.refresh', () => openapiView.refresh());

    const helpView = new HelpView(context, webviewContent);
    vscode.window.registerTreeDataProvider('help', helpView);
    vscode.commands.registerCommand('karavan.openKamelets', () => helpView.openKaravanWebView("kamelets"));
    vscode.commands.registerCommand('karavan.openComponents', () => helpView.openKaravanWebView("components"));
    vscode.commands.registerCommand('karavan.openEip', () => helpView.openKaravanWebView("eip"));

    // Create new Integration CRD command
    const createCrd = vscode.commands.registerCommand("karavan.create-crd", (...args: any[]) => {
        if (args.length > 0) designer.createIntegration(true, args[0].fsPath)
        else designer.createIntegration(true, rootPath)
    });
    context.subscriptions.push(createCrd);

    // Create new Integration YAML command
    const createYaml = vscode.commands.registerCommand("karavan.create-yaml", (...args: any[]) => designer.createIntegration(false, args[0].fsPath));
    context.subscriptions.push(createYaml);

    // Open integration in designer command
    const open = vscode.commands.registerCommand("karavan.open", (...args: any[]) => designer.karavanOpen(args[0].fsPath, args[0].tab));
    context.subscriptions.push(open);

    // Open integration in editor command
    const openFile = vscode.commands.registerCommand("karavan.open-file", (...args: any[]) => {
        let uri = vscode.Uri.file(args[0].fsPath);
        vscode.window.showTextDocument(uri, { preserveFocus: false, preview: false });
    });
    context.subscriptions.push(openFile);

    // Export to Quarkus or Spring
    const exportOptions = ["Quarkus", "Spring"];
    const exportCommand = vscode.commands.registerCommand("karavan.jbang-export", (...args: any[]) => {
        window.showQuickPick(exportOptions, { title: "Select Runtime", canPickMany: false }).then((value) => {
            if (value) inputExportFolder(value, rootPath);
        })
    });
    context.subscriptions.push(exportCommand);

    // Run Integration in designer command
    const run = vscode.commands.registerCommand("karavan.jbang-run-file", (...args: any[]) => designer.jbangRun(args[0].fsPath));
    context.subscriptions.push(run);

    // Run project
    const runProjectCommand = vscode.commands.registerCommand("karavan.jbang-run-project", (...args: any[]) => {
        console.log("RUN PROJECT")
        const profiles = utils.getProfiles(rootPath);
        console.log("profiles", profiles)
        if (profiles && profiles.length > 0) {
            profiles.push("Default");
            window.showQuickPick(profiles, { title: "Select Profile", canPickMany: false }).then((value) => {
                if (value && rootPath) commands.camelJbangRun(rootPath, value !== "Default" ? value : undefined);
            })
        } else {
            if (rootPath) commands.camelJbangRun(rootPath);
        }
    });
    context.subscriptions.push(runProjectCommand);

    // Generate RST API from OpenAPI specification command
    const generateOptions = ["Create new CRD", "Create new YAML", "Add to existing file"];
    const generateRest = vscode.commands.registerCommand('karavan.generate-rest', async (...args: any[]) => {
        const openApi: OpenApiItem = args[0];
        window.showQuickPick(generateOptions, { title: "Select REST Generator options", canPickMany: false }).then((value) => {
            switch (value) {
                case generateOptions[0]: inputFileName(true, rootPath, openApi); break;
                case generateOptions[1]: inputFileName(false, rootPath, openApi); break;
                case generateOptions[2]: selectFileName(rootPath, openApi); break;
            }
        })
    });
    context.subscriptions.push(generateRest);

    // Create issue command
    vscode.commands.registerCommand('karavan.reportIssue', () => {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://github.com/apache/camel-karavan/issues/new?title=[VS+Code]New+report&template=issue_template.md'));
    });
}

/**
 * export into folder
 */
export async function inputExportFolder(runtime: string, rootPath?: string) {
    vscode.window.showInputBox({
        title: "Export project with " + runtime,
        ignoreFocusOut: true,
        prompt: "Export folder name",
        validateInput: (text: string): string | undefined => {
            if (!text || text.length === 0) {
                return 'Name should not be empty';
            } else {
                return undefined;
            }
        }
    }).then(folder => {
        if (folder && rootPath) {
            const fullPath = rootPath + path.sep + folder;
            inputExportGav(runtime.toLowerCase(), folder);
        }
    });
}

/**
 * export with gav
 */
export async function inputExportGav(runtime: string, folder: string) {
    vscode.window.showInputBox({
        title: "Export project with " + runtime,
        ignoreFocusOut: true,
        prompt: "groupId:artifactId:version",
        validateInput: (text: string): string | undefined => {
            if (!text || text.length === 0) {
                return 'Name should not be empty. Format groupId:artifactId:version';
            } else {
                return undefined;
            }
        }
    }).then(gav => {
        if (gav) {
            commands.camelJbangExport(runtime.toLowerCase(), folder, gav);
        }
    });
}

export function deactivate() {
    vscode.commands.executeCommand("setContext", KARAVAN_LOADED, false);
}


