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
import { workspace, TreeDataProvider, EventEmitter, Event, TreeItem, ProviderResult, Command, ThemeIcon, TreeItemCollapsibleState } from "vscode";
import * as path from "path";
import * as utils from "./utils";
import { CamelDefinitionYaml } from "core/api/CamelDefinitionYaml";
import { DesignerView } from "./designerView";
import { Integration } from "core/model/IntegrationDefinition";

export class IntegrationView implements TreeDataProvider<IntegrationItem> {

	constructor(private designer: DesignerView, private rootPath: string | undefined) {

	}
	private _onDidChangeTreeData: EventEmitter<IntegrationItem | undefined | void> = new EventEmitter<IntegrationItem | undefined | void>();
	readonly onDidChangeTreeData: Event<IntegrationItem | undefined | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: IntegrationItem): TreeItem | Thenable<TreeItem> {
		return element;
	}
	getChildren(element?: IntegrationItem): ProviderResult<IntegrationItem[]> {
		if (element === undefined && this.rootPath) {
			return this.getIntegrations(this.rootPath);
		} else if (element && element.integration) {
			const integrations: IntegrationItem[] = [];
			element.integration.spec.flows?.forEach(f => {
				integrations.push(new IntegrationItem(f.dslName.replace("Definition", ""), "", f.id, undefined, undefined));
			})
			return integrations;
		}
		return Promise.resolve([]);
	}

	async getIntegrations(dir: string) {
		const result:IntegrationItem[] = []
		const files = await utils.getYamlFiles(dir);
		for (let x in files){
			const filename = files[x];
			const readData = await utils.readFile(path.resolve(filename));
			const yaml = Buffer.from(readData).toString('utf8');
			if (!filename.startsWith(dir + path.sep + "target") && CamelDefinitionYaml.yamlIsIntegration(yaml)){
				const basename = path.basename(filename);
				const i = CamelDefinitionYaml.yamlToIntegration(basename, yaml);
				result.push(new IntegrationItem(i.metadata.name, filename, i.crd ? "CRD" : "", i, { command: 'karavan.open', title: '', arguments: [{ fsPath: filename }] }));
			}
			
		}
		return result;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class IntegrationItem extends TreeItem {

	constructor(
		public readonly title: string,
		public readonly fsPath: string,
		public readonly description: string,
		public readonly integration?: Integration,
		public readonly command?: Command
	) {
		super(title, integration ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
		this.tooltip = this.fsPath;
	}

	iconPath = this.integration ? {
		light: path.join(__filename, '..', '..', 'icons', 'light', this.integration?.crd ? 'crd.svg' : 'karavan.svg'),
		dark: path.join(__filename, '..', '..', 'icons', 'dark', this.integration?.crd ? 'crd.svg' : 'karavan.svg')
	} : ThemeIcon.File;

	contextValue = this.integration ? 'integration' : "route";
}