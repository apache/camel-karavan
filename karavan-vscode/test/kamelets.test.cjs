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

const context = {extensionPath: path.resolve("extension")};
const builtinPath = path.join(context.extensionPath, "metadata", "kamelets.yaml");
const kamelet = name => `kind: Kamelet\nmetadata:\n  name: ${name}\nspec:\n  definition:\n    title: ${name}\n`;
let source;
let files;
let errors;
const vscode = {
    Uri: {file: fullPath => ({fsPath: fullPath})},
    workspace: {
        getConfiguration: () => ({get: () => source}),
        fs: {
            readFile: async uri => {
                if (!files.has(uri.fsPath)) throw new Error("File not found");
                return Buffer.from(files.get(uri.fsPath));
            },
            readDirectory: async () => [["custom.kamelet.yaml", 1]],
        },
    },
};

// Exercise the extension and webview TypeScript without launching VS Code.
function loadSource(relativePath, mocks = {}) {
    const fullPath = path.join(__dirname, "..", relativePath);
    const loaded = new Module(fullPath, module);
    loaded.filename = fullPath;
    loaded.paths = module.paths;
    loaded.require = request => {
        if (request in mocks) return mocks[request];
        if (request.startsWith("@karavan-core/")) return {};
        return require(request);
    };
    const code = ts.transpileModule(readFileSync(fullPath, "utf8"), {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
        },
    }).outputText;
    loaded._compile(code, fullPath);
    return loaded.exports;
}

const utils = loadSource(path.join("src", "utils.ts"), {vscode});
const {KameletApi} = loadSource(path.join("webview", "karavan-core", "api", "KameletApi.ts"), {
    "../model/KameletModels": loadSource(path.join("webview", "karavan-core", "model", "KameletModels.ts")),
});
const names = documents => documents.map(code => yaml.load(code).metadata.name);

beforeEach(t => {
    source = undefined;
    files = new Map([[builtinPath, kamelet("builtin")]]);
    errors = [];
    t.mock.method(console, "error", (...args) => errors.push(args));
});

for (const newline of ["\n", "\r\n"]) {
    test(`delivers the shipped catalog as single-document webview entries with ${JSON.stringify(newline)} line endings`, async () => {
        const catalog = readFileSync(path.join(__dirname, "..", "metadata", "kamelets.yaml"), "utf8");
        const expected = yaml.loadAll(catalog).filter(document => document !== null && document !== undefined);
        assert.ok(expected.length > 1);
        files.set(builtinPath, catalog.replace(/\r?\n/g, newline));
        const documents = await utils.readKamelets(context);
        assert.equal(documents.length, expected.length);
        assert.deepEqual(documents.map(document => yaml.load(document)), expected);
        KameletApi.saveCustomKamelets(documents, true);
        assert.deepEqual(KameletApi.getCustomKameletNames().sort(), expected.map(document => document.metadata.name).sort());
        assert.deepEqual(errors, []);
    });
}

test("handles directives, commented separators, empty documents and block scalars", async () => {
    files.set(builtinPath, ("%YAML 1.2\n--- # first\n" + kamelet("first")
        + "    description: |\n      ---\n      example\n"
        + "--- # empty\n--- # second\n" + kamelet("second") + "...\n").replaceAll("\n", "\r\n"));
    const documents = await utils.readKamelets(context);
    assert.deepEqual(names(documents), ["first", "second"]);
    assert.equal(yaml.load(documents[0]).spec.definition.description, "---\nexample\n");
    assert.deepEqual(errors, []);
});

test("preserves custom directory loading", async () => {
    source = path.resolve("custom");
    files.set(path.join(source, "custom.kamelet.yaml"), kamelet("custom"));
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin", "custom"]);
    assert.deepEqual(errors, []);
});

test("a missing built-in catalog is logged without blocking custom Kamelets", async () => {
    files.delete(builtinPath);
    source = path.resolve("custom");
    files.set(path.join(source, "custom.kamelet.yaml"), kamelet("custom"));
    assert.deepEqual(names(await utils.readKamelets(context)), ["custom"]);
    assert.equal(errors.length, 1);
    assert.match(errors[0][0], /failed to load built-in Kamelets/);
});

test("malformed built-in YAML is logged without loading a partial catalog", async () => {
    files.set(builtinPath, kamelet("valid") + "---\nkind: [");
    assert.deepEqual(await utils.readKamelets(context), []);
    assert.equal(errors.length, 1);
    assert.match(errors[0][0], /failed to load built-in Kamelets/);
});
