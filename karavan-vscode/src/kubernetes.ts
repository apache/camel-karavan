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
import * as utils from "./utils";

export interface Result {
    result: boolean
    value: any
    error: string
}

export function hasOcClient(): boolean {
    const oc = shell.which('oc');
    return oc !== undefined;
}

export function getOcUser(): Result {
    const oc = shell.which('oc');
    if (oc) {
        shell.config.execPath = String(oc);

        shell.exec('oc whoami', {silent:true}, function(code, stdout, stderr) {
            console.log('Exit code:', code);
            console.log('Program output:', stdout);
            console.log('Program stderr:', stderr);
          });

          const { stdout, stderr, code } = shell.exec("oc whoami",  {silent:true});
        console.log(stdout, stderr, code);
        return {result: code === 0, value: stdout, error: stderr};
    } else {
        return {result: false, value: undefined, error: "Openshift client not found!"}
    }
}
