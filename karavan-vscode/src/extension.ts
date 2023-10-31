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
import * as exec from "./exec";
import { TopologyView } from './topologyView';

const KARAVAN_LOADED = "karavan:loaded";

export function activate(context: ExtensionContext) {

    const rootPath = (workspace.workspaceFolders && (workspace.workspaceFolders.length > 0))
        ? workspace.workspaceFolders[0].uri.fsPath : undefined;

    // Register views    
    const designer = new DesignerView(context, rootPath);

    const integrationView = new IntegrationView(designer, rootPath);
    window.registerTreeDataProvider('integrations', integrationView);
    commands.registerCommand('integrations.refresh', () => integrationView.refresh());

    const openapiView = new OpenApiView(designer, rootPath);
    window.registerTreeDataProvider('openapi', openapiView);
    commands.registerCommand('openapi.refresh', () => openapiView.refresh());

    const helpView = new HelpView(context);
    window.registerTreeDataProvider('help', helpView);
    commands.registerCommand('karavan.openKnowledgebase', () => helpView.openKaravanWebView("knowledgebase"));

    const topologyView = new TopologyView(context);
    const topologyCommand = commands.registerCommand("karavan.topology", (...args: any[]) => {
        topologyView.openKaravanWebView(args[0]?.fsPath);
    });
    context.subscriptions.push(topologyCommand);

    // Create new Integration command
    const createYaml = commands.registerCommand("karavan.create-yaml", (...args: any[]) => {
        designer.createIntegration("plain", args[0]?.fsPath)
    });
    context.subscriptions.push(createYaml);


    // Create new Kamelet command
    const createKamelet = commands.registerCommand("karavan.create-kamelet", (...args: any[]) => {
        designer.createIntegration("kamelet", args[0]?.fsPath)
    });
    context.subscriptions.push(createKamelet);


    // Open integration in designer command
    const open = commands.registerCommand("karavan.open", (...args: any[]) => {
        designer.karavanOpen(args[0].fsPath, args[0].tab);
    });
    context.subscriptions.push(open);

    // Open integration in editor command
    const openFile = commands.registerCommand("karavan.open-file", (...args: any[]) => {
        let uri = Uri.file(args[0].fsPath);
        window.showTextDocument(uri, { preserveFocus: false, preview: false });
    });
    context.subscriptions.push(openFile);

    // Create application
    const applicationCommand = commands.registerCommand("karavan.create-application", async (...args: any[]) => {
        if (rootPath) {
            const defaultRuntime: string = workspace.getConfiguration().get("camel.runtimes") || '';
            const deployTarget: string = workspace.getConfiguration().get("camel.deployTarget") || 'openshift';
            const runtimeOptions: QuickPickItem[] = [
                { label: "camel-main", picked: "camel-main" === defaultRuntime },
                { label: "quarkus", picked: "quarkus" === defaultRuntime },
                { label: "spring-boot", picked: "spring-boot" === defaultRuntime }
            ];
            const deployOptions: QuickPickItem[] = [
                { label: "openshift", picked: "openshift" === deployTarget },
                { label: "kubernetes", picked: "kubernetes" === deployTarget },
                { label: "none", picked: "none" === deployTarget }
            ];
            const hasAP = await utils.hasApplicationProperties(rootPath);
            let createApp = !hasAP;
            if (hasAP) {
                const replaceOptions: QuickPickItem[] = [
                    { label: "Replace", picked: false },
                    { label: "Cancel", picked: true }
                ];
                const replace = await window.showQuickPick(replaceOptions, {title: "Application already exists!", canPickMany: false });
                createApp = replace?.label === replaceOptions.at(0)?.label;
            }
            if (createApp){
                window.showQuickPick(runtimeOptions, { title: "Select Runtime", canPickMany: false }).then((runtime) => {
                    window.showQuickPick(deployOptions, { title: "Select Deploy Target", canPickMany: false }).then((target) => {
                        if (runtime && target) utils.createApplication(runtime.label, target.label)
                    })
                })
            }
        }
    });
    context.subscriptions.push(applicationCommand);

    // Export project
    const exportCommand = commands.registerCommand("karavan.jbang-export", (...args: any[]) => {
        exportAndRunProject(rootPath);
    });
    context.subscriptions.push(exportCommand);

    // Deploy project
    const deployCommand = commands.registerCommand("karavan.deploy", (...args: any[]) => {
        exec.camelDeploy(rootPath + path.sep + ".export");
    });
    context.subscriptions.push(deployCommand);

    // Run project with jbang
    const runJbang = commands.registerCommand("karavan.run-project-jbang", (...args: any[]) => {
        jbang.camelJbangRun();        
    });
    context.subscriptions.push(runJbang);

    // Run project with runtime
    const runRuntime = commands.registerCommand("karavan.run-project-runtime", (...args: any[]) => {
        utils.getProperties(rootPath).then(properties => {
            if (properties.length > 0){
                exportAndRunProject(rootPath, true);
            } else {
                window.showErrorMessage("No runtime configured! Create application!")
            }
        })
        
    });
    context.subscriptions.push(runRuntime);

    // Generate REST API from OpenAPI specification command
    const generateOptions = ["Create new Integration", "Add to existing Integration"];
    const generateRest = commands.registerCommand('karavan.generate-rest', async (...args: any[]) => {
        const openApi: OpenApiItem = args[0];
        window.showQuickPick(generateOptions, { title: "Select REST Generator options", canPickMany: false }).then((value) => {
            switch (value) {
                case generateOptions[0]: inputFileName(rootPath, openApi); break;
                case generateOptions[1]: selectFileName(rootPath, openApi); break;
            }
        })
    });
    context.subscriptions.push(generateRest);

    // Download Image command
    const downloadImageCommand = commands.registerCommand("karavan.download-image", (...args: any[]) => {
        designer.downloadImage(args[0].fsPath);
    });
    context.subscriptions.push(downloadImageCommand);

    // Create issue command
    commands.registerCommand('karavan.reportIssue', () => {
        commands.executeCommand('open', Uri.parse('https://github.com/apache/camel-karavan/issues/new?title=[VS+Code]New+report&template=issue_template.md'));
    });
}

/**
 * export into folder and optionally run
 */
export async function exportAndRunProject(rootPath?: string, run?: boolean) {
    utils.getExportFolder()
        .then(folder => {
            if (folder){
                const fullPath = rootPath + path.sep + folder;
                exec.runWithRuntime(fullPath, run);
            } else {
                window.showInputBox({
                    title: "Export project",
                    ignoreFocusOut: true,
                    prompt: "Export folder name",
                    value: ".export",
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
                        exec.runWithRuntime(fullPath, run);
                    }
                });
            }
        }).catch(error => {
            console.log(error);
        })
}

export function deactivate() {
    commands.executeCommand("setContext", KARAVAN_LOADED, false);
}