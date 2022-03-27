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
import { KameletApi } from "karavan-core/lib/api/KameletApi";
import { KameletModel } from "karavan-core/lib/model/KameletModels";
import { ThemeIcon } from "vscode";

export class KameletView implements vscode.TreeDataProvider<KameletItem> {

    constructor(private context: vscode.ExtensionContext, private rootPath: string | undefined) {

    }
	private _onDidChangeTreeData: vscode.EventEmitter<KameletItem | undefined | void> = new vscode.EventEmitter<KameletItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<KameletItem | undefined | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: KameletItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: KameletItem): vscode.ProviderResult<KameletItem[]> {
		const kamelets: KameletItem[] = [];
		if (this.rootPath){
			utils.readKamelets(this.context).forEach(s => {
				const k:KameletModel = KameletApi.yamlToKamelet(s);
				kamelets.push(new KameletItem(k.spec.definition.title, k.spec.definition.description, k.type()));
			})
		}
		return Promise.resolve(kamelets);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class KameletItem extends vscode.TreeItem {

	constructor(
		public readonly title: string,
		public readonly description: string,
		private readonly type: string,
		public readonly command?: vscode.Command
	) {
		super(title, vscode.TreeItemCollapsibleState.None);

		this.tooltip = this.description;
		this.description = this.type;
	}

	iconPath = ThemeIcon.File;

	contextValue = 'kamelet';
}