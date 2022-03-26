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
import { ComponentApi } from "karavan-core/lib/api/ComponentApi";
import { Component } from "karavan-core/lib/model/ComponentModels";
import { ThemeIcon } from "vscode";

export class ComponentView implements vscode.TreeDataProvider<ComponentItem> {

    constructor(private context: vscode.ExtensionContext, private rootPath: string | undefined) {

    }
	private _onDidChangeTreeData: vscode.EventEmitter<ComponentItem | undefined | void> = new vscode.EventEmitter<ComponentItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<ComponentItem | undefined | void> = this._onDidChangeTreeData.event;

	getTreeItem(element: ComponentItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: ComponentItem): vscode.ProviderResult<ComponentItem[]> {
		const kamelets: ComponentItem[] = [];
		if (this.rootPath){
			utils.readComponents(this.context).forEach(s => {
				const c:Component = ComponentApi.jsonToComponent(s);
				if (!c.component.deprecated) 
				kamelets.push(new ComponentItem(c.component.title, c.component.description, c.component.label));
			})
		}
		return Promise.resolve(kamelets);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class ComponentItem extends vscode.TreeItem {

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

	contextValue = 'component';
}