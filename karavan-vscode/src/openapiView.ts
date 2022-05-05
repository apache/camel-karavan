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
import vscode, { window } from "vscode";
import * as path from "path";
import * as utils from "./utils";
import * as commands from "./commands";
import * as fs from "fs";
import { ThemeIcon } from "vscode";
import { CamelDefinitionYaml } from "karavan-core/lib/api/CamelDefinitionYaml";
import { DesignerView } from "./designerView";
import { Integration } from "karavan-core/lib/model/IntegrationDefinition";

export class OpenApiView implements vscode.TreeDataProvider<OpenApiItem> {

	constructor(private designer: DesignerView, private rootPath: string | undefined) {

	}
	private _onDidChangeTreeData: vscode.EventEmitter<OpenApiItem | undefined | void> = new vscode.EventEmitter<OpenApiItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<OpenApiItem | undefined | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: OpenApiItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: OpenApiItem): vscode.ProviderResult<OpenApiItem[]> {
		const openapis: OpenApiItem[] = [];
		if (this.rootPath) {
			utils.getJsonFiles(this.rootPath).forEach(f => {
				const json = fs.readFileSync(path.resolve(f)).toString('utf8');
				const api = JSON.parse(json);
				if (api.openapi) {
					const filename = path.basename(f);
					openapis.push(new OpenApiItem(filename, f, api?.info?.title, { command: 'karavan.open-file', title: 'Open file', arguments: [{ fsPath: f }] }));
				}
			})
		}
		return Promise.resolve(openapis);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class OpenApiItem extends vscode.TreeItem {

	constructor(
		public readonly title: string,
		public readonly fsPath: string,
		public readonly description: string,
		public readonly command?: vscode.Command
	) {
		super(title, vscode.TreeItemCollapsibleState.None);
		this.tooltip = this.fsPath;
	}

	iconPath = new ThemeIcon("symbol-interface");

	contextValue = "openapi";
}

/**
 * Select routes generation
 */
export async function selectRouteGeneration(rootPath: string, openApiFullPath: string, fullPath: string, add: boolean, crd?: boolean) {
	const options = ["Generate REST and Routes", 'Generate REST only'];
	await window.showQuickPick(options, {
		title: "Generate route stubs for REST API",
		placeHolder: 'Select option',
	}).then(option => {
		const generateRoutes: boolean = option !== undefined && option === options[0];
		commands.camelJbangGenerate(rootPath, openApiFullPath, fullPath, add, crd, generateRoutes);
	});
}

/**
 * Select file and add REST API
 */
export async function selectFileName(rootPath?: string, openApi?: OpenApiItem) {
	if (rootPath && openApi?.fsPath) {
		const files = utils.getIntegrationFiles(rootPath);
		await window.showQuickPick(files, {
			title: "Select Integration file to add REST API",
			placeHolder: 'Select file',
		}).then(fullPath => {
			if (fullPath && openApi?.fsPath) {
				selectRouteGeneration(rootPath, openApi.fsPath, fullPath, true, undefined);
			}
		});
	}
}

/**
 * Create new file and add REST API
 */
export async function inputFileName(crd: boolean, rootPath?: string, openApi?: OpenApiItem) {
	vscode.window.showInputBox({
		title: "Generate REST API from " + openApi?.title,
		ignoreFocusOut: true,
		prompt: "Integration file name",
		validateInput: (text: string): string | undefined => {
			if (!text || text.length === 0 || !text.endsWith(".yaml")) {
				return 'Name should not be empty. Extension should be .yaml';
			} else {
				return undefined;
			}
		}
	}).then(filename => {
		if (filename && openApi?.fsPath && rootPath) {
			const fullPath = rootPath + path.sep + filename;
			selectRouteGeneration(rootPath, openApi.fsPath, fullPath, false, crd);
		}
	});
}