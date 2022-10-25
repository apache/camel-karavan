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
import { Command, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window, Event } from "vscode";
import * as path from "path";
import * as utils from "./utils";
import * as jbang from "./jbang";
import * as yaml from 'js-yaml';
import { ThemeIcon } from "vscode";
import { DesignerView } from "./designerView";

export class OpenApiView implements TreeDataProvider<OpenApiItem> {

	constructor(private designer: DesignerView, private rootPath: string | undefined) {

	}
	private _onDidChangeTreeData: EventEmitter<OpenApiItem | undefined | void> = new EventEmitter<OpenApiItem | undefined | void>();
	readonly onDidChangeTreeData: Event<OpenApiItem | undefined | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: OpenApiItem): TreeItem | Thenable<TreeItem> {
		return element;
	}
	getChildren(element?: OpenApiItem): ProviderResult<OpenApiItem[]> {
		if (this.rootPath) {
			return this.getOpenApiItems(this.rootPath);
		} else {
			return Promise.resolve([]);
		}
	}

	async getOpenApiItems(dir: string) {
		const result:OpenApiItem[] = []
		const files = await utils.getJsonFiles(dir);
		for (let x in files){
			const filename = files[x];
			const readData = await utils.readFile(path.resolve(filename));
			const json = Buffer.from(readData).toString('utf8');
			const api = JSON.parse(json);
			if (api.openapi) {
				const basename = path.basename(filename);
				result.push(new OpenApiItem(basename, filename, api?.info?.title, { command: 'karavan.open-file', title: 'Open file', arguments: [{ fsPath: filename }] }));
			}
		}
		const yfiles = await utils.getYamlFiles(dir);
		for (let x in yfiles){
			const filename = yfiles[x];
			const readData = await utils.readFile(path.resolve(filename));
			const text = Buffer.from(readData).toString('utf8');
			const api: any = yaml.load(text);
			if (api.openapi) {
				const basename = path.basename(filename);
				result.push(new OpenApiItem(basename, filename, api?.info?.title, { command: 'karavan.open-file', title: 'Open file', arguments: [{ fsPath: filename }] }));
			}
		}
		return result;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class OpenApiItem extends TreeItem {

	constructor(
		public readonly title: string,
		public readonly fsPath: string,
		public readonly description: string,
		public readonly command?: Command
	) {
		super(title, TreeItemCollapsibleState.None);
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
		jbang.camelJbangGenerate(rootPath, openApiFullPath, fullPath, add, crd, generateRoutes);
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
	window.showInputBox({
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