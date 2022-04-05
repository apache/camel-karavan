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
import * as utils from "./utils";
import { CamelModelMetadata, ElementMeta } from "karavan-core/lib/model/CamelMetadata";
import { ThemeIcon } from "vscode";

export class EipView implements vscode.TreeDataProvider<EipItem> {

    constructor(private context: vscode.ExtensionContext, private rootPath: string | undefined) {

    }
	private _onDidChangeTreeData: vscode.EventEmitter<EipItem | undefined | void> = new vscode.EventEmitter<EipItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<EipItem | undefined | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: EipItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: EipItem): vscode.ProviderResult<EipItem[]> {
		const kamelets: EipItem[] = [];
		if (this.rootPath){
			CamelModelMetadata.sort((a, b) => {
				if (a.title.toLowerCase() < b.title.toLowerCase()) {
					return -1;
				}
				return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : 0;
			}).forEach((e:ElementMeta) => {
				kamelets.push(new EipItem(e.title, e.description, e.labels));
			})
		}
		return Promise.resolve(kamelets);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class EipItem extends vscode.TreeItem {

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

	contextValue = 'eip';
}