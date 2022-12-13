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
import * as shell from 'shelljs';
import { window, Terminal, ThemeIcon } from "vscode";

export interface Result {
    result: boolean
    value: any
    error: string
}

export function execCommand(cmd: string, execPath?: string): Promise<Result> {
    return new Promise<Result>((resolve) => {
        if (execPath) shell.cd(execPath);
        shell.exec(cmd, (code, stdout, stderr) => resolve({ result: code === 0, value: stdout, error: stderr }));
    });
}

const TERMINALS: Map<string, Terminal> = new Map<string, Terminal>();


export function execTerminalCommand(terminalId: string, command: string, env?: { [key: string]: string | null | undefined }) {
    const existTerminal = TERMINALS.get(terminalId);
    if (existTerminal) existTerminal.dispose();
    const terminal = window.createTerminal({ name: terminalId, env: env, iconPath: new ThemeIcon("layers") });
    TERMINALS.set(terminalId, terminal);
    terminal.show();
    terminal.sendText(command);
}