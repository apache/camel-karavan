/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const {beforeEach, test} = require("node:test");
const ts = require("typescript");
const yaml = require("js-yaml");

let settings;
let directories;
let files;
let errors;
let commands;
const context = {extensionPath: path.resolve("extension")};
const builtinPath = path.join(context.extensionPath, "metadata", "kamelets.yaml");
const kamelet = "kind: Kamelet\nmetadata:\n  name: builtin\n";
const vscode = {
    FileType: {File: 1, Directory: 2},
    Uri: {file: fullPath => ({fsPath: fullPath})},
    ThemeIcon: class {},
    workspace: {
        getConfiguration: () => ({get: key => settings[key]}),
        fs: {
            stat: async uri => {
                if (directories.has(uri.fsPath)) return {type: 2};
                if (files.has(uri.fsPath)) return {type: 1};
                throw new Error("File not found");
            },
            readFile: async uri => Buffer.from(files.get(uri.fsPath)),
        },
    },
    window: {
        showErrorMessage: message => errors.push(message),
        createTerminal: () => ({show() {}, dispose() {}, sendText: command => commands.push(command)}),
    },
};

// Exercise the command builders and callers without launching VS Code or terminals.
function loadSource(filename, mocks) {
    const fullPath = path.join(__dirname, "..", "src", filename);
    const loaded = new Module(fullPath, module);
    loaded.filename = fullPath;
    loaded.paths = module.paths;
    loaded.require = request => {
        if (request in mocks) return mocks[request];
        if (request.startsWith("@karavan-core/")) return {};
        return require(request);
    };
    loaded._compile(ts.transpileModule(readFileSync(fullPath, "utf8"), {
        compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
    }).outputText, fullPath);
    return loaded.exports;
}

const utils = loadSource("utils.ts", {vscode});
const jbang = loadSource("jbang.ts", {
    vscode,
    "./utils": utils,
    "./exec": {execTerminalCommand: (_id, command) => commands.push(command)},
    shelljs: {},
});
const exec = loadSource("exec.ts", {
    vscode,
    "./utils": {
        ...utils,
        getRuntime: async () => "quarkus",
        getTarget: async () => "kubernetes",
        getExportFolder: async () => ".export",
    },
    "./jbang": jbang,
    shelljs: {exec: (_command, callback) => callback(0, "namespace", "")},
});

beforeEach(() => {
    settings = {};
    directories = new Set();
    files = new Map([[builtinPath, kamelet]]);
    errors = [];
    commands = [];
});

test("editor sources never affect Camel JBang run/export", async () => {
    for (const source of [path.resolve("custom"), path.resolve("catalog.yaml"), "http://example.invalid/catalog", "https://example.invalid/catalog", ""]) {
        settings["Karavan.kameletsPath"] = source;
        const command = await jbang.createExportCommand("export", "camel-main");
        await jbang.camelJbangRun();
        for (const actual of [command, commands.at(-1)]) {
            assert.equal(actual.includes("--local-kamelet-dir="), false);
        }
    }
    assert.deepEqual(errors, []);
});

test("the runtime directory is trimmed, quoted and does not change the editor catalog", async () => {
    const directory = path.resolve("runtime kamelets");
    directories.add(directory);
    settings["camel.localKameletDir"] = ` ${directory} `;
    assert.deepEqual((await utils.readKamelets(context)).map(document => yaml.load(document)), [yaml.load(kamelet)]);
    const command = await jbang.createExportCommand("export", "camel-main");
    await jbang.camelJbangRun();
    await exec.runWithRuntime("project", true);
    for (const actual of [command, ...commands]) {
        assert.ok(actual.includes(`--local-kamelet-dir="${directory}"`));
    }
    assert.match(commands.at(-1), /&& mvn clean compile quarkus:dev -f project$/);
    assert.deepEqual(errors, []);
});

test("unset and whitespace-only runtime settings omit the option", async () => {
    for (const value of [undefined, "", "   "]) {
        settings["camel.localKameletDir"] = value;
        assert.equal(await utils.getLocalKameletsDirectory(), undefined);
        assert.equal((await jbang.createExportCommand("export", "camel-main")).includes("--local-kamelet-dir"), false);
        await jbang.camelJbangRun();
        assert.equal(commands.at(-1).includes("--local-kamelet-dir"), false);
    }
});

test("files, URLs and missing directories prevent run and export", async () => {
    const file = path.resolve("catalog.yaml");
    files.set(file, kamelet);
    for (const value of [file, "http://example.invalid/catalog", "https://example.invalid/catalog", path.resolve("missing")]) {
        settings["camel.localKameletDir"] = value;
        await assert.rejects(jbang.createExportCommand("export", "camel-main"), /must point to a (local )?directory|File not found/);
        await jbang.camelJbangRun();
        await exec.runWithRuntime("project");
    }
    assert.deepEqual(commands, []);
    assert.equal(errors.length, 8);
    assert.match(errors[0], /failed to run project/);
    assert.match(errors[1], /failed to export project/);
});

test("deploy awaits directory validation and reports errors without starting a terminal", async () => {
    settings["camel.localKameletDir"] = path.resolve("missing");
    exec.camelDeploy("project");
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(commands, []);
    assert.match(errors[0], /File not found/);
});

test("deploy includes the validated runtime directory and deployment command", async () => {
    const directory = path.resolve("runtime kamelets");
    directories.add(directory);
    settings["camel.localKameletDir"] = directory;
    settings["Karavan.quarkusKubernetesDeploy"] = "mvn clean package";
    exec.camelDeploy("project");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(commands.length, 1);
    assert.ok(commands[0].includes(`--local-kamelet-dir="${directory}"`));
    assert.match(commands[0], /&& mvn clean package -f .export$/);
    assert.deepEqual(errors, []);
});
