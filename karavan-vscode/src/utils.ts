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

export function save(relativePath: string, text: string){
    if (vscode.workspace.workspaceFolders) {
        const uriFolder: vscode.Uri = vscode.workspace.workspaceFolders[0].uri;
        const uriFile: vscode.Uri = vscode.Uri.file(path.join(uriFolder.path, relativePath));
        fs.writeFile(uriFile.fsPath, text, err => {
            if (err) vscode.window.showErrorMessage("Error: " + err?.message);
        });
    }
}

export function deleteFile(fullPath: string){
    if (vscode.workspace.workspaceFolders) {
        fs.rmSync(path.resolve(fullPath));
    }
}

export function getRalativePath(fullPath: string): string {
    const root = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.path : "";
    const normalizedRoot = vscode.Uri.file(root).fsPath ;
    const relativePath = path.resolve(fullPath).replace(normalizedRoot + path.sep, '');
    return relativePath;
}

export function readKamelets(context: vscode.ExtensionContext): string[] {
    const dir = path.join(context.extensionPath, 'kamelets');
    const yamls: string[] = fs.readdirSync(dir).filter(file => file.endsWith("yaml")).map(file => fs.readFileSync(dir + "/" + file, 'utf-8'));
    try {
        const kameletsPath: string = vscode.workspace.getConfiguration().get("Karavan.kameletsPath") || '';
        const kameletsDir = path.isAbsolute(kameletsPath) ? kameletsPath : path.resolve(kameletsPath);
        const customKamelets: string[] = fs.readdirSync(kameletsDir).filter(file => file.endsWith("yaml")).map(file => fs.readFileSync(kameletsDir + "/" + file, 'utf-8'));
        if (customKamelets && customKamelets.length > 0) yamls.push(...customKamelets);
    } catch (e) {

    }
    return yamls;
}

export function readComponents(context: vscode.ExtensionContext): string[] {
    const dir = path.join(context.extensionPath, 'components');
    const jsons: string[] = fs.readdirSync(dir).filter(file => file.endsWith("json")).map(file => fs.readFileSync(dir + "/" + file, 'utf-8'));
    return jsons;
}

export function parceYaml(filename: string, yaml: string): [boolean, string?] {
    const i = CamelDefinitionYaml.yamlToIntegration(filename, yaml);
    if (i.kind === 'Integration' && i.metadata.name) {
        return [true, yaml];
    } else {
        return [false, undefined];
    }
}

export function disableStartHelp(){
    const config = vscode.workspace.getConfiguration();
    config.update("Karavan.showStartHelp", false);
}

export function toCliFilename(filename: string): string {
    return (/\s/).test(filename)
        ? '"' + filename + '"'
        : filename.replace(/\s/g, "\\ ");
}

export function nameFromTitle(title: string): string {
    return title.replace(/[^a-z0-9+]+/gi, "-").toLowerCase();
}

export function getAllFiles (dirPath, arrayOfFiles: string[]): string[]  {
    const files = fs.readdirSync(dirPath)
  
    arrayOfFiles = arrayOfFiles || []
  
    files.forEach(function(file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
      } else {
        arrayOfFiles.push(path.join(dirPath, "/", file))
      }
    })
    return arrayOfFiles
  }

export function getYamlFiles(baseDir: string): string[] {
    const result:string[] = [];
    getAllFiles(baseDir, []).filter(f => f.endsWith(".yaml")).forEach(f => {
        result.push(f);
    })
    return result;
}

export function getPropertyFiles(baseDir: string): string[] {
    const result:string[] = [];
    getAllFiles(baseDir, []).filter(f => f.endsWith(".properties")).forEach(f => {
        result.push(f);
    })
    return result;
}

export function getJsonFiles(baseDir: string): string[] {
    const result:string[] = [];
    getAllFiles(baseDir, []).filter(f => f.endsWith(".json")).forEach(f => {
        result.push(f);
    })
    return result;
}

export function getIntegrationFiles(baseDir: string): string[]{
    return getYamlFiles(baseDir).filter(f => {
        const yaml = fs.readFileSync(path.resolve(f)).toString('utf8');
        return !f.startsWith(baseDir + path.sep + "target") && CamelDefinitionYaml.yamlIsIntegration(yaml);
    });
}