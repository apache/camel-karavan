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
const {createServer} = require("node:http");
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
let directories;
let errors;
let logs;
const vscode = {
    FileType: {File: 1, Directory: 2},
    Uri: {file: fullPath => ({fsPath: fullPath})},
    workspace: {
        getConfiguration: () => ({get: key => key === "Karavan.kameletsPath" ? source : undefined}),
        fs: {
            stat: async uri => {
                if (directories.has(uri.fsPath)) return {type: 2};
                if (files.has(uri.fsPath)) return {type: 1};
                throw new Error("File not found");
            },
            readFile: async uri => {
                if (!files.has(uri.fsPath)) throw new Error("File not found");
                return Buffer.from(files.get(uri.fsPath));
            },
            readDirectory: async uri => directories.get(uri.fsPath),
        },
    },
    window: {showErrorMessage: message => errors.push(message)},
};

// Exercise the host loader and webview consumer without launching VS Code.
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
    loaded._compile(ts.transpileModule(readFileSync(fullPath, "utf8"), {
        compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
    }).outputText, fullPath);
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
    directories = new Map();
    errors = [];
    logs = [];
    t.mock.method(console, "error", (...args) => logs.push(args));
});

test("keeps the built-in catalog when no custom source is configured", async () => {
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin"]);
    assert.deepEqual(errors, []);
});

test("editor catalogs never become JBang runtime-directory arguments", () => {
    const commands = [];
    const jbang = loadSource(path.join("src", "jbang.ts"), {
        vscode,
        "./utils": utils,
        "./exec": {execTerminalCommand: (_id, command) => commands.push(command)},
        shelljs: {},
    });
    for (const value of [path.resolve("custom"), path.resolve("custom.yaml"), "http://example.invalid/catalog", "https://example.invalid/catalog"]) {
        source = value;
        const command = jbang.createExportCommand("export", "camel-main");
        jbang.camelJbangRun();
        for (const actual of [command, commands.at(-1)]) {
            assert.equal(actual.includes("--local-kamelet-dir"), false);
            assert.equal(actual.includes(value), false);
        }
    }
    assert.deepEqual(errors, []);
});

test("loads CRLF built-ins and custom documents through the webview Kamelet API", async () => {
    files.set(builtinPath, (kamelet("builtin-one") + "---\n" + kamelet("builtin-two")).replaceAll("\n", "\r\n"));
    source = path.resolve("custom.yaml");
    files.set(source, kamelet("custom-one") + "---\n" + kamelet("custom-two"));
    const documents = await utils.readKamelets(context);
    assert.deepEqual(names(documents), ["builtin-one", "builtin-two", "custom-one", "custom-two"]);
    KameletApi.saveCustomKamelets(documents, true);
    assert.deepEqual(KameletApi.getCustomKameletNames(), names(documents));
    assert.deepEqual(errors, []);
});

test("delivers the shipped built-in catalog as single-document entries with either line ending", async () => {
    const catalog = readFileSync(path.join(__dirname, "..", "metadata", "kamelets.yaml"), "utf8");
    const expected = yaml.loadAll(catalog).filter(document => document !== null && document !== undefined);
    assert.ok(expected.length > 1);
    for (const newline of ["\n", "\r\n"]) {
        files.set(builtinPath, catalog.replace(/\r?\n/g, newline));
        const documents = await utils.readKamelets(context);
        assert.deepEqual(documents.map(document => yaml.load(document)), expected);
        KameletApi.saveCustomKamelets(documents, true);
        assert.deepEqual(KameletApi.getCustomKameletNames().sort(), expected.map(document => document.metadata.name).sort());
    }
    assert.deepEqual(errors, []);
});

test("reads a trimmed relative path to a single local YAML file", async () => {
    source = " custom.yaml ";
    files.set(path.resolve(source.trim()), kamelet("single"));
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin", "single"]);
    assert.deepEqual(errors, []);
});

test("supports directives, commented separators, empty documents, CRLF and block scalars", async () => {
    source = path.resolve("catalog.yaml");
    files.set(source, ("%YAML 1.2\n--- # first\n" + kamelet("first")
        + "    description: |\n      ---\n      example\n"
        + "--- # empty\n--- # second\n" + kamelet("second") + "...\n").replaceAll("\n", "\r\n"));
    const documents = await utils.readKamelets(context);
    assert.deepEqual(names(documents), ["builtin", "first", "second"]);
    assert.equal(yaml.load(documents[1]).spec.definition.description, "---\nexample\n");
    assert.deepEqual(errors, []);
});

test("preserves non-recursive directory loading and supports multiple documents per file", async () => {
    source = path.resolve("custom");
    directories.set(source, [["first.yaml", 1], ["second.kamelet.yaml", 1], ["ignore.txt", 1], ["nested", 2]]);
    files.set(path.join(source, "first.yaml"), kamelet("first") + "---\n" + kamelet("second"));
    files.set(path.join(source, "second.kamelet.yaml"), kamelet("third"));
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin", "first", "second", "third"]);
    assert.deepEqual(errors, []);
});

test("reports missing custom sources without blocking the built-in catalog", async () => {
    source = path.resolve("missing.yaml");
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin"]);
    assert.match(errors[0], /failed to load custom Kamelets.*File not found/);
    assert.equal(logs.length, 1);
});

test("reports malformed YAML and non-Kamelet documents without loading partial custom catalogs", async () => {
    source = path.resolve("catalog.yaml");
    for (const document of ["kind: [", "kind: ConfigMap", "false", "42", "[]", "name: missing-kind"]) {
        files.set(source, kamelet("valid") + "---\n" + document);
        assert.deepEqual(names(await utils.readKamelets(context)), ["builtin"]);
    }
    assert.equal(errors.length, 6);
    assert.equal(logs.length, 6);
});

test("built-in failures are logged without blocking valid custom Kamelets", async () => {
    source = path.resolve("custom.yaml");
    files.set(source, kamelet("custom"));
    files.delete(builtinPath);
    assert.deepEqual(names(await utils.readKamelets(context)), ["custom"]);
    for (const invalid of ["kind: [", kamelet("valid") + "---\nkind: ConfigMap"]) {
        files.set(builtinPath, invalid);
        assert.deepEqual(names(await utils.readKamelets(context)), ["custom"]);
    }
    assert.equal(logs.length, 3);
    assert.match(logs[0][0], /failed to load built-in Kamelets/);
    assert.deepEqual(errors, []);
});

test("loads remote multi-document YAML, follows redirects and reports HTTP failures", async t => {
    const server = createServer((request, response) => {
        if (request.url === "/redirect") {
            response.writeHead(302, {Location: "/catalog"});
            response.end();
        } else if (request.url === "/catalog") {
            response.end(kamelet("remote-one") + "---\n" + kamelet("remote-two"));
        } else {
            response.writeHead(404);
            response.end();
        }
    });
    t.after(() => new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
        server.closeAllConnections();
    }));
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    source = `${base}/redirect`;
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin", "remote-one", "remote-two"]);
    assert.deepEqual(errors, []);
    source = `${base}/missing`;
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin"]);
    assert.match(errors[0], /HTTP 404/);
});

test("supports HTTPS sources and reports network failures", async t => {
    source = "https://example.invalid/catalog.yaml";
    t.mock.method(globalThis, "fetch", async url => {
        assert.equal(url, source);
        return new Response(kamelet("https"));
    });
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin", "https"]);
    t.mock.method(globalThis, "fetch", async () => { throw new Error("Network failure"); });
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin"]);
    assert.match(errors[0], /Network failure/);
});

function setEnvironment(t, values) {
    for (const [name, value] of Object.entries(values)) {
        const previous = process.env[name];
        t.after(() => {
            if (previous === undefined) delete process.env[name];
            else process.env[name] = previous;
        });
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
    }
}

test("expands both environment syntaxes throughout a URL without encoding or recursive expansion", async t => {
    setEnvironment(t, {
        KARAVAN_TEST_HOST: "example.invalid",
        KARAVAN_TEST_PATH: "catalog.yaml",
        KARAVAN_TEST_TOKEN: "encoded%2Fvalue$&",
        KARAVAN_TEST_LITERAL: "${KARAVAN_TEST_HOST}",
        KARAVAN_TEST_EMPTY: "",
    });
    source = "https://${env:KARAVAN_TEST_HOST}/${KARAVAN_TEST_PATH}?token=${env:KARAVAN_TEST_TOKEN}&host=${KARAVAN_TEST_HOST}&literal=${KARAVAN_TEST_LITERAL}${KARAVAN_TEST_EMPTY}";
    t.mock.method(globalThis, "fetch", async url => {
        assert.equal(url, "https://example.invalid/catalog.yaml?token=encoded%2Fvalue$&&host=example.invalid&literal=${KARAVAN_TEST_HOST}");
        return new Response(kamelet("expanded"));
    });
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin", "expanded"]);
    assert.deepEqual(errors, []);
});

test("supports an environment variable containing the entire catalog URL", async t => {
    setEnvironment(t, {KARAVAN_TEST_URL: "https://example.invalid/catalog.yaml"});
    t.mock.method(globalThis, "fetch", async url => {
        assert.equal(url, "https://example.invalid/catalog.yaml");
        return new Response(kamelet("expanded"));
    });
    for (const value of ["${env:KARAVAN_TEST_URL}", "${KARAVAN_TEST_URL}"]) {
        source = value;
        assert.deepEqual(names(await utils.readKamelets(context)), ["builtin", "expanded"]);
    }
    assert.deepEqual(errors, []);
});

test("reports missing environment variables before fetching without exposing resolved values", async t => {
    setEnvironment(t, {KARAVAN_TEST_MISSING: undefined, KARAVAN_TEST_TOKEN: "test-secret-value"});
    const fetch = t.mock.method(globalThis, "fetch", async () => { throw new Error("Must not fetch"); });
    source = "https://example.invalid/${KARAVAN_TEST_TOKEN}/${env:KARAVAN_TEST_MISSING}";
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin"]);
    assert.equal(fetch.mock.callCount(), 0);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /Environment variable "KARAVAN_TEST_MISSING" is not defined in the extension host/);
    assert.equal(errors[0].includes("test-secret-value"), false);
    assert.equal(logs.length, 1);
    assert.equal(logs[0][1].message.includes("test-secret-value"), false);
});

test("resolves environment variables in local paths as well as URLs", async t => {
    setEnvironment(t, {KARAVAN_TEST_FILE: path.resolve("custom.yaml")});
    source = "${env:KARAVAN_TEST_FILE}";
    files.set(process.env.KARAVAN_TEST_FILE, kamelet("local"));
    assert.deepEqual(names(await utils.readKamelets(context)), ["builtin", "local"]);
    assert.deepEqual(errors, []);
});

test("aborts remote loading after 30 seconds", async t => {
    source = "https://example.invalid/catalog.yaml";
    t.mock.timers.enable({apis: ["setTimeout"]});
    let notifyStarted;
    const started = new Promise(resolve => { notifyStarted = resolve; });
    t.mock.method(globalThis, "fetch", (_url, {signal}) => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("Request aborted")));
        notifyStarted();
    }));
    const result = utils.readKamelets(context);
    await started;
    t.mock.timers.tick(29999);
    assert.deepEqual(errors, []);
    t.mock.timers.tick(1);
    assert.deepEqual(names(await result), ["builtin"]);
    assert.match(errors[0], /Request aborted/);
});
