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
import { workspace, window } from "vscode";
import * as path from "path";
import * as shell from 'shelljs';
import * as utils from "./utils";
import * as exec from "./exec";

export async function camelJbangGenerate(rootPath: string, openApiFullPath: string, fullPath: string, add: boolean, generateRoutes?: boolean) {
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
                    yaml = utils.createYaml(filename, stdout, camelYaml);
                    utils.write(fullPath, yaml);
                });
            } else {
                yaml = utils.createYaml(filename, stdout, undefined);
                utils.write(fullPath, yaml);
            }
        } else {
            window.showErrorMessage(stderr);
        }
    });
}

function prepareCommand(command: string): string {
    const version = workspace.getConfiguration().get("camel.version");
    return "jbang -Dcamel.jbang.version=" + version + " camel@apache/camel " + command;
}

export function camelJbangRun() {
    const maxMessages: number = workspace.getConfiguration().get("camel.maxMessages") || -1;
    const kameletsPath: string | undefined = workspace.getConfiguration().get("Karavan.kameletsPath");
    const dev: boolean = workspace.getConfiguration().get("camel.dev") || false;
    const cmd = "run * "
        + (maxMessages > -1 ? " --max-messages=" + maxMessages : "")
        + (kameletsPath && kameletsPath.trim().length > 0 ? " --local-kamelet-dir=" + kameletsPath : "");
    const command = prepareCommand(cmd) + (dev === true ? " --dev" : "");
    exec.execTerminalCommand("jbang-run", command);
}

export function createExportCommand(fullPath: string) {
    const kameletsPath: string | undefined = workspace.getConfiguration().get("Karavan.kameletsPath");
    const cmd = "export --fresh " 
        + (fullPath ? " --directory=" + fullPath : '')
        + (kameletsPath && kameletsPath.trim().length > 0 ? " --local-kamelet-dir=" + kameletsPath : "");
    return prepareCommand(cmd);
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


