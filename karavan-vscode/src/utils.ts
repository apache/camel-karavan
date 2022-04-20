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

const TERMINALS: Map<string, vscode.Terminal> = new Map<string, vscode.Terminal>();

export function save(relativePath: string, yaml: string){
    if (vscode.workspace.workspaceFolders) {
        const uriFolder: vscode.Uri = vscode.workspace.workspaceFolders[0].uri;
        const uriFile: vscode.Uri = vscode.Uri.file(path.join(uriFolder.path, relativePath));
        fs.writeFile(uriFile.fsPath, yaml, err => {
            if (err) vscode.window.showErrorMessage("Error: " + err?.message);
        });
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

export function camelJbangRun(filename: string) {
    const version = vscode.workspace.getConfiguration().get("camel.version");
    const maxMessages: number = vscode.workspace.getConfiguration().get("camel.maxMessages") || -1;
    const loggingLevel = vscode.workspace.getConfiguration().get("camel.loggingLevel");
    const reload = vscode.workspace.getConfiguration().get("camel.reload");
    const health = vscode.workspace.getConfiguration().get("camel.health");
    const messageTracing = vscode.workspace.getConfiguration().get("camel.messageTracing");
    const command = "jbang -Dcamel.jbang.version=" + version + " camel@apache/camel run "
        + toCliFilename(filename)
        + (maxMessages > -1 ? " --max-messages=" + maxMessages : "")
        + " --logging-level=" + loggingLevel
        + (messageTracing ? " --trace" : "")
        + (reload ? " --reload" : "")
        + (health ? " --health" : "");
    const existTerminal = TERMINALS.get(filename);
    if (existTerminal) existTerminal.dispose();
    const terminal = vscode.window.createTerminal('Camel: ' + filename);
    TERMINALS.set(filename, terminal);
    terminal.show();
    terminal.sendText(command);
}

export function toCliFilename(filename: string): string {
    return (/\s/).test(filename)
        ? '"' + filename + '"'
        : filename.replace(/\s/g, "\\ ");
}

export function nameFromTitle(title: string): string {
    return title.replace(/[^a-z0-9+]+/gi, "-").toLowerCase();
}

function getAllFiles (dirPath, arrayOfFiles: string[]): string[]  {
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

export function camelJbangGenerate(openApiFullPath: string, fullPath: string,  add: boolean, crd?: boolean) {
    const version = vscode.workspace.getConfiguration().get("camel.version");
    const command = "jbang -Dcamel.jbang.version=" + version + " camel@apache/camel generate rest -i " + openApiFullPath;
    const jbang = shell.which('jbang');
    if (jbang){
        shell.config.execPath = String(jbang);
        shell.exec(command, { async: true }, (code, stdout, stderr) => {
            console.log('Exit code:', code);
            if (code === 0){
                // console.log('Program output:', stdout);
                const filename = path.basename(fullPath);
                let yaml;
                if (add) {
                    const camelYaml = fs.readFileSync(path.resolve(fullPath)).toString('utf8');
                    yaml = createYaml(filename, stdout, camelYaml, undefined);
                } else {
                    yaml = createYaml(filename, stdout, undefined, crd);
                }
                const uriFile: vscode.Uri = vscode.Uri.file(fullPath);
                fs.writeFile(uriFile.fsPath, yaml, err => {
                    if (err) vscode.window.showErrorMessage("Error: " + err?.message);
                    else {
                        vscode.commands.executeCommand('integrations.refresh')
                        .then(x => vscode.commands.executeCommand('karavan.open', {fsPath: fullPath, tab: 'rest'}));
                    }
                });
            } else {
                vscode.window.showErrorMessage(stderr);
            }
        });
    }
}

export function createYaml(filename: string, restYaml: string, camelYaml?: string, crd?: boolean): string {
    if (camelYaml) {
        const i = CamelDefinitionYaml.yamlToIntegration(filename, camelYaml);
        const rest = CamelDefinitionYaml.yamlToIntegration(filename, restYaml);
        i.spec.flows = i.spec.flows?.filter(f => f.dslName !== 'RestDefinition');
        i.spec.flows?.push(...rest.spec.flows || []);
        return CamelDefinitionYaml.integrationToYaml(i);
    } else if (crd === true){
        const i = CamelDefinitionYaml.yamlToIntegration(filename, restYaml);
        i.crd = true;
        return CamelDefinitionYaml.integrationToYaml(i);
    } else {
        return restYaml;
    }
}


