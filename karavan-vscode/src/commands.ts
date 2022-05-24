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

const TERMINALS: Map<string, vscode.Terminal> = new Map<string, vscode.Terminal>();

export function camelJbangGenerate(rootPath: string, openApiFullPath: string, fullPath: string, add: boolean, crd?: boolean, generateRoutes?: boolean) {
    let command = prepareCommand("generate rest -i " + openApiFullPath, "application"); // TODO: set profile configurable
    if (generateRoutes === true) command = command + " --routes";
    executeJbangCommand(rootPath, command, (code, stdout, stderr) => {
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

export function camelJbangPackage(rootPath: string, profile: string, callback: (code: number) => any) {
    executeJbangCommand(rootPath, prepareCommand("package uber-jar", profile), (code, stdout, stderr) => callback(code));
}

export function camelJbangBuildImage(rootPath: string, profile: string, project: ProjectModel, callback: (code: number) => any) {
    const munikubeCommand = "minikube -p minikube docker-env";
    let command = prepareCommand("build image", profile, project);
    if (project.target === 'minikube') {
        console.log("Build in minikube")
        executeJbangCommand(rootPath, munikubeCommand, (code, stdout, stderr) => {
            if (code === 0) {
                setMinikubeEnvVariables(stdout).forEach((value: string, key: string) => shell.env[key] = value);
                executeJbangCommand(rootPath, command, (code, stdout, stderr) => callback(code));
            }
        })
    } else {
        removeMinikubeEnvVariables();
        console.log(shell.env)
        executeJbangCommand(rootPath, command, (code, stdout, stderr) => callback(code));
    }
}

export function camelJbangDeploy(rootPath: string, profile: string, project: ProjectModel, callback: (code: number) => any) {
    executeJbangCommand(rootPath, prepareCommand("deploy", profile, project), (code, stdout, stderr) => callback(code));
}

export function camelJbangManifests(rootPath: string, profile: string, project: ProjectModel, callback: (code: number) => any) {
    executeJbangCommand(rootPath, prepareCommand("build manifests", profile, project), (code, stdout, stderr) => callback(code));
}


export function camelJbangUndeploy(rootPath: string, profile: string, project: ProjectModel, callback: (code: number) => any) {
    executeJbangCommand(rootPath, prepareCommand("undeploy", profile, project), (code, stdout, stderr) => callback(code));
}

export function cacheClear(rootPath: string, callback: (code: number) => any) {
    executeJbangCommand(rootPath, "jbang cache clear", (code, stdout, stderr) => callback(code));
}

function prepareCommand(command: string, profile: string, project?: ProjectModel): string {
    const version = vscode.workspace.getConfiguration().get("camel.version");
    const token = project && project.target ? " --token " + project.token : "";
    const password = project && project.password ? " --password " + project.password : "";
    return "jbang -Dcamel.jbang.version=" + version + " camel@apache/camel " + command + token + password + " --profile " + profile;
}

export function camelJbangRun(rootPath: string, profile: string, filename?: string) {
    const maxMessages: number = vscode.workspace.getConfiguration().get("camel.maxMessages") || -1;
    const cmd = (filename ? "run " + filename : "run * " ) + (maxMessages > -1 ? " --max-messages=" + maxMessages : "");
    const command = prepareCommand(cmd, profile);
    const existTerminal = TERMINALS.get(profile);
    if (existTerminal) existTerminal.dispose();
    const terminal = vscode.window.createTerminal('Camel run: ' + profile);
    TERMINALS.set(profile, terminal);
    terminal.show();
    terminal.sendText(command);
}

function executeJbangCommand(rootPath: string, command: string, callback: (code: number, stdout: any, stderr: any) => any) {
    console.log("excute command", command)
    const jbang = shell.which('jbang');
    if (jbang) {
        shell.config.execPath = String(jbang);
        shell.cd(rootPath);
        shell.exec(command, { async: false }, (code, stdout, stderr) => {
            if (code === 0) {
                // vscode.window.showInformationMessage(stdout);
            } else {
                vscode.window.showErrorMessage(stderr);
            }
            callback(code, stdout, stderr);
        });
    } else {
        vscode.window.showErrorMessage("JBang not found!");
    }
}

function setMinikubeEnvVariables(env: string): Map<string, string> {
    const map = new Map<string, string>();
    const linesAll = env.split(/\r?\n/);
    const vars = linesAll.filter(l => l !== undefined && l.startsWith("export")).map(line => line.replace("export", ""));
    vars.forEach(line => {
        const parts = line.split("=");
        const key = parts[0].trim();
        const value = parts[1].replaceAll('"', '').trim();
        map.set(key, value);
    })
    return map;
}

function removeMinikubeEnvVariables() {
    delete shell.env['DOCKER_TLS_VERIFY'];
    delete shell.env['DOCKER_HOST'];
    delete shell.env['DOCKER_CERT_PATH'];
    delete shell.env['MINIKUBE_ACTIVE_DOCKERD'];
}

export function cleanup(rootPath: string, project: ProjectModel, callback: (code: number, stdout: any, stderr: any) => any) {
    shell.cd(rootPath);
    shell.rm('-r', path.resolve(rootPath, ".camel-jbang"));
    shell.rm(path.resolve(rootPath, project.filename));  
}

