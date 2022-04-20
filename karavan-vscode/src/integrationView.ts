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
import * as path from "path";
import * as utils from "./utils";
import * as fs from "fs";
import { CamelDefinitionYaml } from "karavan-core/lib/api/CamelDefinitionYaml";
import { DesignerView } from "./designerView";
import { Integration } from "karavan-core/lib/model/IntegrationDefinition";

export class IntegrationView implements vscode.TreeDataProvider<IntegrationItem> {

	constructor(private designer: DesignerView, private rootPath: string | undefined) {

	}
	private _onDidChangeTreeData: vscode.EventEmitter<IntegrationItem | undefined | void> = new vscode.EventEmitter<IntegrationItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<IntegrationItem | undefined | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: IntegrationItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: IntegrationItem): vscode.ProviderResult<IntegrationItem[]> {
		const integrations: IntegrationItem[] = [];
		if (element === undefined && this.rootPath) {
			utils.getIntegrationFiles(this.rootPath).forEach(f => {
				const yaml = fs.readFileSync(path.resolve(f)).toString('utf8');
				const filename = path.basename(f);
				const i = CamelDefinitionYaml.yamlToIntegration(filename, yaml);
				integrations.push(new IntegrationItem(i.metadata.name, f, i.crd ? "CRD" : "", i, { command: 'karavan.open', title: '', arguments: [{ fsPath: f }] }));
			})
		} else if (element && element.integration) {
			element.integration.spec.flows?.forEach(f => {
				integrations.push(new IntegrationItem(f.dslName.replace("Definition", ""), "", f.id, undefined, undefined));
			})
		}
		return Promise.resolve(integrations);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class IntegrationItem extends vscode.TreeItem {

	constructor(
		public readonly title: string,
		public readonly fsPath: string,
		public readonly description: string,
		public readonly integration?: Integration,
		public readonly command?: vscode.Command
	) {
		super(title, integration ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
		this.tooltip = this.fsPath;
	}

	iconPath = this.integration ? {
		light: path.join(__filename, '..', '..', 'icons', 'light', this.integration?.crd ? 'crd.svg' : 'karavan.svg'),
		dark: path.join(__filename, '..', '..', 'icons', 'dark', this.integration?.crd ? 'crd.svg' : 'karavan.svg')
	} : vscode.ThemeIcon.File;

	contextValue = this.integration ? 'integration' : "route";
}