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
const {test} = require("node:test");
const ts = require("typescript");
const React = require("react");

test("Custom only preserves categories and filters both regular and preferred cards", () => {
    const states = [];
    const effects = [];
    let cursor = 0;
    let mounted = false;
    const react = {
        ...React,
        useState: initial => {
            const index = cursor++;
            if (!(index in states)) states[index] = initial;
            return [states[index], value => {
                states[index] = typeof value === "function" ? value(states[index]) : value;
            }];
        },
        useEffect: effect => {
            if (!mounted) effects.push(effect);
        },
    };
    const selector = {
        showSelector: true,
        showSteps: true,
        parentId: "route",
        parentDsl: "FromDefinition",
        selectedToggles: ["eip", "components", "kamelets"],
        setShowSelector: () => {},
        setShowProperties: () => {},
        setSelectedDsl: () => {},
        addSelectedToggle: toggle => selector.selectedToggles.push(toggle),
        deleteSelectedToggle: toggle => {
            selector.selectedToggles = selector.selectedToggles.filter(value => value !== toggle);
        },
    };
    const elements = [
        {name: "log", dsl: "LogDefinition", navigation: "eip"},
        {name: "direct", uri: "direct", navigation: "component"},
        {name: "custom", navigation: "kamelet"},
        {name: "other", navigation: "kamelet"},
    ];
    let customNames = ["custom"];
    const mocks = {
        react,
        "@patternfly/react-core": new Proxy({}, {get: (_target, name) => name}),
        "./DslSelector.css": {},
        "../utils/CamelUi": {CamelUi: {
            getSelectorModelsForParentFiltered: (_parent, navigation) => elements.filter(element => element.navigation === navigation),
            checkFilter: (element, filter) => element.name.includes(filter),
        }},
        "../utils/DslMetaModel": {},
        "../DesignerStore": {useSelectorStore: select => select(selector)},
        "zustand/shallow": {},
        "@karavan-core/api/ComponentApi": {ComponentApi: {getBlockedComponentNames: () => []}},
        "@karavan-core/api/KameletApi": {KameletApi: {getCustomKameletNames: () => customNames}},
        "@patternfly/react-icons/dist/esm/icons/times-icon": "TimesIcon",
        "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon": "ExclamationCircleIcon",
        "./DslPreferences": {
            getPreferredElements: () => ["LogDefinition", "direct", "custom", "other"],
        },
        "./DslFastCard": {DslFastCard: "DslFastCard"},
        "./DslCard": {DslCard: "DslCard"},
        "usehooks-ts": {useDebounceValue: initial => react.useState(initial)},
        uuid: {},
        "@features/project/designer/utils/ValidatorUtils": {},
        "@stores/ProjectStore": {useFilesStore: select => select({files: []})},
    };
    // Exercise the selector TypeScript without a browser or VS Code host.
    const fullPath = path.join(__dirname, "..", "webview", "karavan", "features", "project", "designer", "selector", "DslSelector.tsx");
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
            jsx: ts.JsxEmit.React,
            esModuleInterop: true,
        },
    }).outputText;
    loaded._compile(code, fullPath);
    const render = () => {
        cursor = 0;
        return loaded.exports.DslSelector({onDslSelect: () => {}});
    };
    const nodes = tree => {
        if (Array.isArray(tree)) return tree.flatMap(nodes);
        if (!React.isValidElement(tree)) return [];
        return [tree, ...nodes(tree.props.children)];
    };
    const cardNames = (tree, type) => nodes(tree).filter(node => node.type === type).map(node => node.props.dsl.name);
    const toggleCustom = (tree, checked) => nodes(tree).find(node => node.type === "Switch").props.onChange({}, checked);
    const assertCards = expected => {
        const tree = render();
        assert.deepEqual(cardNames(tree, "DslCard"), expected);
        assert.deepEqual(cardNames(tree, "DslFastCard"), expected);
    };
    render();
    mounted = true;
    effects.forEach(effect => effect());
    for (const categories of [["eip", "components", "kamelets"], ["components", "kamelets"], ["kamelets"]]) {
        selector.selectedToggles = [...categories];
        const tree = render();
        const before = cardNames(tree, "DslCard");
        assertCards(before);
        toggleCustom(tree, true);
        assert.deepEqual(selector.selectedToggles, categories);
        assertCards(["custom"]);
        toggleCustom(render(), false);
        assert.deepEqual(selector.selectedToggles, categories);
        assertCards(before);
    }

    customNames = [];
    const before = cardNames(render(), "DslCard");
    toggleCustom(render(), true);
    assertCards([]);
    toggleCustom(render(), false);
    assertCards(before);

    customNames = ["custom"];
    selector.selectedToggles = ["eip", "components", "kamelets"];
    const search = value => nodes(render()).find(node => node.type === "TextInput").props.onChange({}, value);
    search("other");
    assertCards(["other"]);
    toggleCustom(render(), true);
    assertCards([]);
    search("custom");
    assertCards(["custom"]);
    toggleCustom(render(), false);
    assertCards(["custom"]);
    search("");

    for (const categories of [["eip"], ["components"], []]) {
        selector.selectedToggles = [...categories];
        const expected = elements.filter(element => categories.includes(element.navigation === "component" ? "components" : element.navigation)).map(element => element.name);
        assertCards(expected);
    }
});
