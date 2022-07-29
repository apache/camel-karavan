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
import { ExtensionContext, Uri, window, workspace, commands, QuickPickItem } from 'vscode';
import { DesignerView } from "./designerView";
import { IntegrationView } from "./integrationView";
import { HelpView } from "./helpView";
import { selectFileName, inputFileName, OpenApiView, OpenApiItem } from "./openapiView";
import * as path from "path";
import * as jbang from "./jbang";
import * as utils from "./utils";
import * as fs from "fs";

const KARAVAN_LOADED = "karavan:loaded";

export function activate(context: ExtensionContext) {
    const webviewContent = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link href="styleUri" rel="stylesheet" type="text/css" />
    </head>
    
    <body>
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="root">
        <div class="pf-c-page karavan">
          <main class="pf-c-page__main" tabindex="-1">
            <section class="pf-c-page__main-section pf-m-dark-200 loading-page"><svg
                class="pf-c-spinner pf-m-xl progress-stepper" role="progressbar" aria-valuetext="Loading..."
                viewBox="0 0 100 100" style="--pf-c-spinner--diameter:80px" aria-label="Loading...">
                <circle class="pf-c-spinner__path" cx="50" cy="50" r="45" fill="none"></circle>
              </svg></section>
          </main>
        </div>
      </div>
      <script>
      </script>
      <script src="scriptUri"></script>
    </body>
    
    </html>`
            .replace(
                "styleUri",
                Uri.joinPath(context.extensionUri, "/dist/main.css")
                    .with({ scheme: "vscode-resource" })
                    .toString()
            )
            .replace(
                "scriptUri",
                Uri.joinPath(context.extensionUri, "/dist/webview.js")
                    .with({ scheme: "vscode-resource" })
                    .toString()
            );
    const rootPath = (workspace.workspaceFolders && (workspace.workspaceFolders.length > 0))
        ? workspace.workspaceFolders[0].uri.fsPath : undefined;

    // Register views    
    const designer = new DesignerView(context, webviewContent, rootPath);

    const integrationView = new IntegrationView(designer, rootPath);
    window.registerTreeDataProvider('integrations', integrationView);
    commands.registerCommand('integrations.refresh', () => integrationView.refresh());

    const openapiView = new OpenApiView(designer, rootPath);
    window.registerTreeDataProvider('openapi', openapiView);
    commands.registerCommand('openapi.refresh', () => openapiView.refresh());

    const helpView = new HelpView(context, webviewContent);
    window.registerTreeDataProvider('help', helpView);
    commands.registerCommand('karavan.openKamelets', () => helpView.openKaravanWebView("kamelets"));
    commands.registerCommand('karavan.openComponents', () => helpView.openKaravanWebView("components"));
    commands.registerCommand('karavan.openEip', () => helpView.openKaravanWebView("eip"));

    // Create new Integration CRD command
    const createCrd = commands.registerCommand("karavan.create-crd", (...args: any[]) => {
        if (args.length > 0) designer.createIntegration(true, args[0].fsPath)
        else designer.createIntegration(true, rootPath)
    });
    context.subscriptions.push(createCrd);

    // Create new Integration YAML command
    const createYaml = commands.registerCommand("karavan.create-yaml", (...args: any[]) => designer.createIntegration(false, args[0]?.fsPath));
    context.subscriptions.push(createYaml);

    // Open integration in designer command
    const open = commands.registerCommand("karavan.open", (...args: any[]) => designer.karavanOpen(args[0].fsPath, args[0].tab));
    context.subscriptions.push(open);

    // Open integration in editor command
    const openFile = commands.registerCommand("karavan.open-file", (...args: any[]) => {
        let uri = Uri.file(args[0].fsPath);
        window.showTextDocument(uri, { preserveFocus: false, preview: false });
    });
    context.subscriptions.push(openFile);

    // Create application
    const applicationCommand = commands.registerCommand("karavan.create-application", (...args: any[]) => {
        if (rootPath){
            const defaultRuntime: string = workspace.getConfiguration().get("camel.runtimes") || '';
            const runtimeOptions: QuickPickItem [] = [
                {label: "quarkus", picked: "quarkus" === defaultRuntime},
                {label: "spring-boot", picked: "spring-boot" === defaultRuntime},
                {label: "camel-main", picked: "camel-main" === defaultRuntime}
            ];
            utils.hasApplicationProperties(rootPath).then(hasAP => {
                if (hasAP){
                    window.showInformationMessage("Folder already contains application.properties");
                } else {
                    window.showQuickPick(runtimeOptions, { title: "Select Runtime", canPickMany: false }).then((value) => {
                        if (value) inputExportGav(value.label) 
                    })
                }
            })
        } 
    });
    context.subscriptions.push(applicationCommand);

    // Export project
    const exportCommand = commands.registerCommand("karavan.jbang-export", (...args: any[]) => {
        inputExportFolder(rootPath);
    });
    context.subscriptions.push(exportCommand);

    // Run Integration in designer command
    const run = commands.registerCommand("karavan.jbang-run-file", (...args: any[]) => designer.jbangRun(args[0].fsPath));
    context.subscriptions.push(run);

    // Run project
    const runProjectCommand = commands.registerCommand("karavan.jbang-run-project", (...args: any[]) => {
        if (rootPath) jbang.camelJbangRun(rootPath);
    });
    context.subscriptions.push(runProjectCommand);

    // Generate RST API from OpenAPI specification command
    const generateOptions = ["Create new CRD", "Create new YAML", "Add to existing file"];
    const generateRest = commands.registerCommand('karavan.generate-rest', async (...args: any[]) => {
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
    commands.registerCommand('karavan.reportIssue', () => {
        commands.executeCommand('open', Uri.parse('https://github.com/apache/camel-karavan/issues/new?title=[VS+Code]New+report&template=issue_template.md'));
    });
}

/**
 * export into folder
 */
export async function inputExportFolder(rootPath?: string) {
    window.showInputBox({
        title: "Export project",
        ignoreFocusOut: true,
        prompt: "Export folder name",
        value: "export",
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
            jbang.camelJbangExport(fullPath);
        }
    });
}

/**
 * export with gav
 */
export async function inputExportGav(runtime: string) {
    window.showInputBox({
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
            utils.crateApplicationproperties(runtime, gav)
        }
    });
}

export function deactivate() {
    commands.executeCommand("setContext", KARAVAN_LOADED, false);
}


