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
import { workspace, window, Terminal, ThemeIcon } from "vscode";
import * as path from "path";
import * as shell from 'shelljs';
import { CamelDefinitionYaml } from "core/api/CamelDefinitionYaml";
import * as utils from "./utils";
import * as exec from "./exec";

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
        i.type = 'crd';
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

export function camelJbangRun(filename?: string) {
    const maxMessages: number = workspace.getConfiguration().get("camel.maxMessages") || -1;
    const kameletsPath: string | undefined = workspace.getConfiguration().get("Karavan.kameletsPath");
    const dev: boolean = workspace.getConfiguration().get("camel.dev") || false;
    const cmd = (filename ? "run " + filename : "run * ")
        + (maxMessages > -1 ? " --max-messages=" + maxMessages : "")
        + (kameletsPath && kameletsPath.trim().length > 0 ? " --local-kamelet-dir=" + kameletsPath : "");
    const command = prepareCommand(cmd) + (dev === true ? " --dev" : "");
    const terminalId = "run_" + filename;
    const existTerminal = TERMINALS.get(terminalId);
    if (existTerminal) existTerminal.dispose();
    const terminal = window.createTerminal('Camel run: ' + filename ? filename : "project");
    TERMINALS.set(terminalId, terminal);
    terminal.show();
    terminal.sendText(command);
}

export async function camelJbangExport(fullPath: string, run?: boolean) {
    let command = createExportCommand(fullPath);
    if (run) {
        const runtime = await utils.getRuntime();
        const mvn = runtime === 'quarkus' ? "quarkus:dev" : "spring-boot:run";
        command = command.concat(" && mvn clean ").concat(mvn).concat(" -f ").concat(fullPath);
    }
    const terminalId = "export";
    const existTerminal = TERMINALS.get(terminalId);
    if (existTerminal) existTerminal.dispose();
    const terminal = window.createTerminal('export');
    TERMINALS.set(terminalId, terminal);
    terminal.show();
    terminal.sendText(command);
}

export function createExportCommand(fullPath: string) {
    const kameletsPath: string | undefined = workspace.getConfiguration().get("Karavan.kameletsPath");
    const cmd = "export --fresh " 
        + (fullPath ? " --directory=" + fullPath : '')
        + (kameletsPath && kameletsPath.trim().length > 0 ? " --local-kamelet-dir=" + kameletsPath : "");
    return prepareCommand(cmd);
}

export function camelDeploy(directory: string) {
    Promise.all([
        utils.getRuntime(),
        utils.getTarget(),
        utils.getExportFolder(),
        exec.execCommand("oc project -q"), // get namespace 
    ]).then(val => {
        const runtime = val[0] || '';
        const target = val[1] || '';
        const exportFolder = val[2] || '';
        let env: any = { "DATE": Date.now().toString() };
        if (target === 'openshift' && val[3].result) {
            env.NAMESPACE = val[3].value.trim();
        } else if (target === 'openshift' && val[3].result === undefined) {
            window.showErrorMessage("Namespace not set \n" + val[3].error);
        }
        const deployCommand: string = workspace.getConfiguration().get("Karavan.".concat(runtime.replaceAll("-", "")).concat(utils.capitalize(target)).concat("Deploy")) || '';
        const command = createExportCommand(directory).concat(" && ").concat(deployCommand).concat(" -f ").concat(exportFolder);
        camelRunDeploy(command, env);
    }).catch((reason: any) => {
        window.showErrorMessage("Error: \n" + reason.message);
    });
}

export function camelRunDeploy(command: string, env?: { [key: string]: string | null | undefined }) {
    const terminalId = "deploy";
    const existTerminal = TERMINALS.get(terminalId);
    if (existTerminal) existTerminal.dispose();
    const terminal = window.createTerminal({ name: terminalId, env: env, iconPath: new ThemeIcon("layers") });
    TERMINALS.set(terminalId, terminal);
    terminal.show();
    terminal.sendText(command);
}

export function createPackageAndPushImageCommand(directory: string) {
    return "mvn clean package -f " + directory
        +  " -Dquarkus.kubernetes.deploy=false"
        +  " -Dquarkus.container-image.build=true -Dquarkus.container-image.push=true"
}

export function createPackageAndDeployCommand(directory: string) {
    return "mvn clean package -f " + directory
        +  " -Dquarkus.kubernetes.deploy=true -Dquarkus.container-image.registry=image-registry.openshift-image-registry.svc:5000"
        +  " -Dquarkus.container-image.build=false -Dquarkus.container-image.push=false"
}

function executeJbangCommand(rootPath: string, command: string, callback: (code: number, stdout: any, stderr: any) => any) {
    console.log("excute command", command);
    const jbang = shell.which('jbang');
    if (jbang) {
        exec.execCommand(command, rootPath).then(res => {
            if (res.result) callback(0, res.value, res.error)
            else window.showErrorMessage(res.error);
        }).catch(error => {
            window.showErrorMessage(error);
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
