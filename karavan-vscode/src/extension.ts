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
import vscode, { window, commands, ExtensionContext } from 'vscode';
import * as fs from "fs";
import { DesignerView } from "./designerView";
import {IntegrationView} from "./integrationView";
import { HelpView } from "./helpView";
import { selectFileName, inputFileName, OpenApiView, OpenApiItem } from "./openapiView";
import { BuilderView } from './builderView';

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

    const builderView = new BuilderView(context, webviewContent, rootPath);
    vscode.commands.registerCommand("karavan.projectBuilder", (...args: any[]) => builderView.openProject());

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
        vscode.window.showTextDocument( uri, { preserveFocus: false, preview: false});
    });
    context.subscriptions.push(openFile);

    // Run Integration in designer command
    const run = vscode.commands.registerCommand("karavan.jbang-run", (...args: any[]) => designer.jbangRun(args[0].fsPath));
    context.subscriptions.push(run);

    // Generate RST API from OpenAPI specification command
    const generateOptions = ["Create new CRD", "Create new YAML", "Add to existing file"];
    const generateRest = commands.registerCommand('karavan.generate-rest', async (...args: any[]) => {
        const openApi: OpenApiItem = args[0];
        window.showQuickPick(generateOptions, {title:"Select REST Generator options", canPickMany: false}).then((value) => {
            switch (value){
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

export function deactivate() {
    vscode.commands.executeCommand("setContext", KARAVAN_LOADED, false);
}
