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
import * as path from "path";
import * as shell from 'shelljs';
import { CamelDefinitionYaml } from "karavan-core/lib/api/CamelDefinitionYaml";
import { ProjectModel } from "karavan-core/lib/model/ProjectModel";
import { ProjectModelApi } from "karavan-core/lib/api/ProjectModelApi";
import { save } from "./utils";

const TERMINALS: Map<string, vscode.Terminal> = new Map<string, vscode.Terminal>();
const filename = "application.properties";

export function saveProject(rootpath: string, project: ProjectModel) {
    let properties = ''
    try {
        properties = fs.readFileSync(path.resolve(rootpath, filename)).toString('utf8');
        console.log(properties);
    } catch (err: any) {
        if (err.code !== 'ENOENT') throw err;
    }
    const newProperties = ProjectModelApi.updateProperties(properties, project);
    save(filename, newProperties);
}