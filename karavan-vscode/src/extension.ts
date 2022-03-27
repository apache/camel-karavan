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
import { DesignerView } from "./designerView";
import {IntegrationView} from "./integrationView";
import { KameletView } from "./kameletView";
import { ComponentView } from "./componentView";
import { DslView } from "./dslView";

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

    const designer = new DesignerView(context, webviewContent);

    // Create new Integration CRD command
    const createCrd = vscode.commands.registerCommand("karavan.create-crd", () => designer.createIntegration(true));
    context.subscriptions.push(createCrd);

    // Create new Integration YAML command
    const createYaml = vscode.commands.registerCommand("karavan.create-yaml", () => designer.createIntegration(false));
    context.subscriptions.push(createYaml);

    // Open Camel-K integration in designer
    const open = vscode.commands.registerCommand("karavan.open", (...args: any[]) => designer.karavanOpen(args[0].fsPath));
    context.subscriptions.push(open);

    // Run Integration in designer
    const run = vscode.commands.registerCommand("karavan.jbang-run", (...args: any[]) => designer.jbangRun(args[0].fsPath));
    context.subscriptions.push(run);

    // Register views
    const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

    const integrationView = new IntegrationView(designer, rootPath);
	vscode.window.registerTreeDataProvider('integrations', integrationView);    
    vscode.commands.registerCommand('integrations.refresh', () => integrationView.refresh());

    const kameletView = new KameletView(context, rootPath);
	vscode.window.registerTreeDataProvider('kamelets', kameletView);    
    vscode.commands.registerCommand('kamelets.refresh', () => kameletView.refresh());

    const componentView = new ComponentView(context, rootPath);
	vscode.window.registerTreeDataProvider('components', componentView);    
    vscode.commands.registerCommand('components.refresh', () => componentView.refresh());

    const dslView = new DslView(context, rootPath);
	vscode.window.registerTreeDataProvider('dsl', dslView);    
    vscode.commands.registerCommand('dsl.refresh', () => dslView.refresh());
}

export function deactivate() {
    vscode.commands.executeCommand("setContext", KARAVAN_LOADED, false);
}
