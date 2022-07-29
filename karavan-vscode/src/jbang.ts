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
import { workspace, window, Terminal } from "vscode";
import * as path from "path";
import * as shell from 'shelljs';
import { CamelDefinitionYaml } from "karavan-core/lib/api/CamelDefinitionYaml";
import * as utils from "./utils";

const TERMINALS: Map<string, Terminal> = new Map<string, Terminal>();

export async function camelJbangGenerate(rootPath: string, openApiFullPath: string, fullPath: string, add: boolean, crd?: boolean, generateRoutes?: boolean) {
    let command = prepareCommand("generate rest -i " + openApiFullPath); 
    if (generateRoutes === true) command = command + " --routes";
    executeJbangCommand(rootPath, command, (code, stdout, stderr) => {
        console.log('Exit code:', code);
        if (code === 0) {
            const filename = path.basename(fullPath);
            let yaml;
            if (add) {
                utils.readFile(fullPath).then(readData => {
                    const camelYaml = Buffer.from(readData).toString('utf8');
                    yaml = createYaml(filename, stdout, camelYaml, undefined);
                    utils.write(fullPath, yaml);
                });
            } else {
                yaml = createYaml(filename, stdout, undefined, crd);
                utils.write(fullPath, yaml);
            }
        } else {
            window.showErrorMessage(stderr);
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
    executeJbangCommand(rootPath, prepareCommand("package uber-jar"), (code, stdout, stderr) => callback(code));
}


export function cacheClear(rootPath: string, callback: (code: number) => any) {
    executeJbangCommand(rootPath, "jbang cache clear", (code, stdout, stderr) => callback(code));
}

function prepareCommand(command: string): string {
    const version = workspace.getConfiguration().get("camel.version");
    return "jbang -Dcamel.jbang.version=" + version + " camel@apache/camel " + command;
}

export function camelJbangRun(rootPath: string, filename?: string) {
    const maxMessages: number = workspace.getConfiguration().get("camel.maxMessages") || -1;
    const cmd = (filename ? "run " + filename : "run * ") + (maxMessages > -1 ? " --max-messages=" + maxMessages : "");
    const command = prepareCommand(cmd);
    const terminalId = "run_" + filename;
    const existTerminal = TERMINALS.get(terminalId);
    if (existTerminal) existTerminal.dispose();
    const terminal = window.createTerminal('Camel run: ' + filename ? filename : "project");
    TERMINALS.set(terminalId, terminal);
    terminal.show();
    terminal.sendText(command);
}

export function camelJbangExport(directory: string) {
    const cmd = "export  --directory=" + directory;
    const command = prepareCommand(cmd);
    const terminalId = "export";
    const existTerminal = TERMINALS.get(terminalId);
    if (existTerminal) existTerminal.dispose();
    const terminal = window.createTerminal('Camel export');
    TERMINALS.set(terminalId, terminal);
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
                window.showErrorMessage(stderr);
            }
            callback(code, stdout, stderr);
        });
    } else {
        window.showErrorMessage("JBang not found!");
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