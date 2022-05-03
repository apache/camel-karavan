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

export function camelJbangGenerate(openApiFullPath: string, fullPath: string, add: boolean, crd?: boolean, generateRoutes?: boolean) {
    const version = vscode.workspace.getConfiguration().get("camel.version");
    let command = "jbang -Dcamel.jbang.version=" + version + " camel@apache/camel generate rest -i " + openApiFullPath;
    if (generateRoutes === true) command = command + " --routes";
    const jbang = shell.which('jbang');
    if (jbang) {
        shell.config.execPath = String(jbang);
        shell.exec(command, { async: true }, (code, stdout, stderr) => {
            console.log('Exit code:', code);
            if (code === 0) {
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
                            .then(x => vscode.commands.executeCommand('karavan.open', { fsPath: fullPath, tab: 'rest' }));
                    }
                });
            } else {
                vscode.window.showErrorMessage(stderr);
            }
        });
    } else {
        vscode.window.showErrorMessage("JBang not found!");
    }
}

export function createYaml(filename: string, restYaml: string, camelYaml?: string, crd?: boolean): string {
    if (camelYaml) {
        const i = CamelDefinitionYaml.yamlToIntegration(filename, camelYaml);
        const rest = CamelDefinitionYaml.yamlToIntegration(filename, restYaml);
        i.spec.flows = i.spec.flows?.filter(f => f.dslName !== 'RestDefinition');
        i.spec.flows?.push(...rest.spec.flows || []);
        return CamelDefinitionYaml.integrationToYaml(i);
    } else if (crd === true) {
        const i = CamelDefinitionYaml.yamlToIntegration(filename, restYaml);
        i.crd = true;
        return CamelDefinitionYaml.integrationToYaml(i);
    } else {
        return restYaml;
    }
}

export function camelJbangPackageAsync(rootPath: string, callback: (code: number) => any) {
    const version = vscode.workspace.getConfiguration().get("camel.version");
    let command = "jbang -Dcamel.jbang.version=" + version + " camel@apache/camel package uber-jar";
    const jbang = shell.which('jbang');
    if (jbang) {
        shell.config.execPath = String(jbang);
        shell.cd(rootPath);
        shell.exec(command, { async: false }, (code, stdout, stderr) => {
            console.log('Exit code:', code);
            if (code === 0) {
                vscode.window.showInformationMessage(stdout);
            } else {
                vscode.window.showErrorMessage(stderr);
            }
            callback(code);
        });
    }
}


export function camelJbangPackage(rootPath: string) {
    const version = vscode.workspace.getConfiguration().get("camel.version");
    let command = "jbang -Dcamel.jbang.version=" + version + " camel@apache/camel package uber-jar";
    const jbang = shell.which('jbang');
    if (jbang) {
        shell.config.execPath = String(jbang);
        shell.cd(rootPath);
        const exec = shell.exec(command, { async: true });
        if (exec.code === 0) {
            vscode.window.showInformationMessage(exec.stdout);
        } else {
            vscode.window.showErrorMessage(exec.stderr);
        }
        return exec.code;
    }
}

