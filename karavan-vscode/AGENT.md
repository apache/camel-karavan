# AGENT.md — Apache Camel Karavan VS Code Developer Agent

Operating guide for an AI agent working on the **Karavan VS Code extension**.
Everything below was verified against the code in this checkout at extension version
**4.22.0**. Paths are relative to `karavan-vscode/` unless stated otherwise.

---

## 1. What this project is

Karavan is an *Integration Toolkit for Apache Camel*. The VS Code extension
(`karavan-vscode`, publisher `camel-karavan`, marketplace id `camel-karavan.karavan`)
embeds the Karavan visual designer as a **webview** and drives Camel JBang / Maven from
the VS Code UI.

It reads and writes **Camel YAML**: plain routes (`*.camel.yaml`), Kamelets
(`*.kamelet.yaml`) and Integration CRDs (`kind: Integration`).

### Layout

```
/karavan
├── docs/                    ← user + developer docs (DEV.md, VSCODE_HOWTO.md, …)
└── karavan-vscode/          ← the extension (the only module checked out here)
    ├── AGENT.md             ← this file
    ├── src/                 ← extension host code (Node, webpack target "node")
    ├── webview/             ← React UI bundled into dist/webview.js
    │   ├── index.tsx App.tsx vscode.ts prerender.tsx
    │   ├── karavan/         ← designer, topology, documentation, stores
    │   └── karavan-core/    ← vendored copy of karavan-core (Camel model + YAML API)
    ├── metadata/            ← components.json (7.3M), kamelets.yaml (1.9M), spiBeans.json
    ├── snippets/            ← Java templates per runtime (Processor, AggregationStrategy)
    ├── icons/ images/
    ├── webpack.config.js tsconfig.json package.json
    └── dist/                ← build output (gitignored)
```

> Other monorepo modules (`karavan-app`, `karavan-core`, `karavan-designer`,
> `karavan-generator`, `karavan-devmode`, `release-utils`, `.github/**`) are *OUT OF SCOPE*. Do not read them; 
> The repository root `/karavan` is not writable; 
> write inside `karavan-vscode/` or `docs/`.

---

## 2. Architecture

### 2.1 Three bundles, one build

`webpack.config.js` exports three configs, all built in one run:

| Config       | Entry                   | Target  | Output |
|--------------|-------------------------|---------|--------|
| extension    | `src/extension.ts`      | node    | `dist/extension.js` (commonjs2, `vscode` external) |
| webview      | `webview/index.tsx`     | web     | `dist/webview.js` + `dist/main.css` |
| prerender    | `webview/prerender.tsx` | node    | `dist/prerender.js` (SSR helper; excluded from the VSIX by `.vscodeignore`) |

`package.json` declares both `main` and `browser` as `./dist/extension.js`, so the
extension is also meant to run as a **web extension** (`vscode-test-web`,
`--extensionDevelopmentKind=web`). Keep `src/` free of Node-only APIs — file I/O already
goes through `workspace.fs`, not `node:fs`.

### 2.2 Extension host (`src/`, ~1.9k LOC)

| File | Responsibility |
|------|----------------|
| `extension.ts` | `activate()` — registers every command and tree view; `exportAndRunProject()`; `deactivate()` clears the `karavan:loaded` context key. |
| `designerView.ts` | Owns designer webview panels (`KARAVAN_PANELS: Map<relativePath, WebviewPanel>`), the message protocol, and data loading. |
| `topologyView.ts` | Single `topology` panel showing the route topology graph. |
| `helpView.ts` | "Help & Feedback" tree + the Knowledgebase webview. |
| `integrationView.ts` | `integrations` tree: scans `*.yaml`, keeps those `CamelDefinitionYaml.yamlIsIntegration()` accepts; children are the flows. |
| `openapiView.ts` | OpenAPI discovery (`*.json` / `*.yaml` with an `openapi` key) + the "Generate REST API" quick-pick flow. |
| `jbang.ts` | Builds Camel JBang command lines (`run`, `export`, `generate rest`). |
| `exec.ts` | `shelljs` exec + a `Map<id, Terminal>` of reusable terminals; `runWithRuntime()`, `camelDeploy()`. |
| `maven.ts` | Two command builders — **currently unreferenced**. |
| `utils.ts` | Everything else: file I/O via `workspace.fs`, kamelet/component/template/bean/java loading, `application.properties` handling, naming rules. |
| `webviewContent.ts` | The HTML shell for every panel (loads `dist/main.css` + `dist/webview.js`). |

### 2.3 Webview (`webview/`)

- `index.tsx` mounts `<ThemeProvider><App/></ThemeProvider>` into `#root`.
- `App.tsx` is a **class component** holding all state and is the sole message endpoint.
  It renders one of three pages: `designer` (`KaravanDesigner`), `topology`
  (`TopologyTab`) or `knowledgebase` (`DocumentationPage`).
- `webview/vscode.ts` exports the `acquireVsCodeApi()` handle (`undefined` outside VS
  Code — the prerender build relies on that).
- State: **zustand** stores (`stores/*.ts`, `designer/DesignerStore.ts`,
  `designer/CodeStore.ts`), created with `createWithEqualityFn` + `shallow`.
- Cross-component events: **rxjs** `Subject`s in `designer/utils/EventBus.ts`
  (`DslPosition`, `Command`, `IntegrationUpdate`, alerts).
- Host callbacks are injected into the designer through the static
  `designer/utils/InfrastructureAPI` class (`setOnSave`, `setOnSaveCustomCode`,
  `setOnInternalConsumerClick`, …). `KaravanDesigner` wires these in its mount effect.
- UI kit: PatternFly 6 (`react-core`, `react-topology`, `react-table`), Monaco editor,
  `elkjs` for topology layout.

### 2.4 `webview/karavan-core` — generated, vendored, and drifting

A **copy** of the upstream `karavan-core/src/core` module, reachable via the
`@karavan-core/*` tsconfig alias.
- `webview/karavan-core` is **machine-generated** by `karavan-generator` from the Camel catalog. Do not hand-edit.

### 2.5 `metadata/` and `snippets/`

`metadata/{components.json,kamelets.yaml,spiBeans.json}` are generated by
`karavan-generator` (`KaravanGenerator.main` clears and regenerates
`karavan-vscode/metadata`) and copied into `dist/metadata` by the prerender config's
`CopyPlugin`. Treat them as build artifacts: regenerate, never hand-edit.

`snippets/<runtime>-<javaType>.java` are Java code templates; `utils.readTemplates()`
selects those whose filename starts with the active runtime and strips the prefix.

---

## 3. Host ⇄ webview message protocol

The single source of truth. Adding a feature almost always means touching **both** ends.

**Webview → host** (`vscode.postMessage`, handled in `designerView.ts` /
`topologyView.ts` / `helpView.ts` `onDidReceiveMessage`):

| command | payload | handler |
|---|---|---|
| `getData` | `reread?: boolean` | `sendData()` — loads kamelets, components, templates, java code, property placeholders, beans |
| `save` | `relativePath`, `code` | `utils.save()` |
| `saveCode` | `name`, `yamlFullPath`, `yamFileName`, `code` | writes `<name>.java` next to the YAML |
| `savePropertyPlaceholder` | `key`, `value` | appends to `application.properties` |
| `internalConsumerClick` | `uri`/`name`/`routeId`/`fileName` | resolves the peer file via `TopologyUtils`, runs `karavan.open` |
| `openFile` (topology only) | `fileName` | runs `karavan.open` |

**Host → webview** (`panel.webview.postMessage`, handled in `App.onMessage`):
`kamelets`, `components`, `templates`, `javaCode`, `files`, `open`
(`{page, filename, relativePath, fullPath, yaml, tab, propertyPlaceholders, beans}`),
`activate` (`{tab}`), `deactivate`, `downloadImage`, `reread` (help view only).

Notes that bite:

- `App` only accepts `open` when `filename === '' && key === ''`. `activate` resets those
  fields and re-requests data with `reread: true` — that is the reload path.
- The designer autosaves on a **2 s `setInterval`** (`saveScheduledChanges`), and only
  while `state.active`. The interval is cleared for non-designer pages.
- Panels are keyed by **relative path** in `designerView.ts`, but `downloadImage()` looks
  the panel up by **filename** — they only coincide for files at the workspace root.

---

## 4. Commands, views and configuration

Contributions live in `package.json`. Commands (all prefixed `karavan.` except the
refresher): `topology`, `create-yaml`, `create-kamelet`, `create-application`, `open`,
`open-file`, `run-project-jbang`, `run-project-runtime`, `jbang-export`, `deploy`,
`generate-rest`, `download-image`, `openKnowledgebase`, `reportIssue`,
`integrations.refresh`.

View container `karavanView` contributes two views: `integrations` and `help`.

> `extension.ts` also calls `window.registerTreeDataProvider('openapi', …)` and registers
> `openapi.refresh`, but **no `openapi` view is contributed** in `package.json`, so that
> tree is never rendered. `karavan.generate-rest` is still reachable from the explorer
> context menu. Fix by adding the view contribution — don't "clean up" the provider.

Settings use two prefixes — keep the convention:

- `camel.*` — `version`, `runtimes` (`camel-main` | `quarkus` | `spring-boot`),
  `deployTarget` (`openshift` | `kubernetes` | `none`), `maxMessages`, `loggingLevel`,
  `dev`, `messageTracing`.
- `Karavan.*` — `kameletsPath`, `defaultGroupId`, `applicationGitignore`, and the
  templated command/properties arrays.

The templated settings are resolved **by string concatenation**:

```
"Karavan." + runtime.replaceAll("-","") + capitalize(target) + "Deploy"      // exec.camelDeploy
"Karavan." + runtime.replaceAll("-","") + "ApplicationProperties"            // utils.createApplicationProperties
"Karavan." + runtime.replaceAll("-","") + capitalize(target) + "Properties"  // utils.createApplicationProperties
```

**Adding a runtime or deploy target means adding every matching key** (e.g.
`Karavan.camelmainKubernetesDeploy`, `Karavan.camelmainKubernetesProperties`). A missing
key silently degrades to `''`. All 3 runtimes × {Openshift, Kubernetes} keys exist today;
the deliberate gap is target `none`, for which no `*NoneDeploy` / `*NoneProperties` keys
are defined.

Placeholders substituted into generated `application.properties`: `$NAME`, `$GAV`,
`$RUNTIME`, `$TARGET` — the `if/else if` chain replaces **only the first match per
line**. `${NAMESPACE}` and `${DATE}` are resolved later as **terminal env vars** by
`exec.camelDeploy` (`DATE=Date.now()`, `NAMESPACE=oc project -q`).

---

## 5. Runtime behaviour worth knowing

- **Runtime resolution** (`utils.getRuntime`): `camel.jbang.runtime` from
  `application.properties` wins; otherwise the `camel.runtimes` setting.
- **Export folder** (`utils.getExportFolder`): `camel.jbang.exportDir`, default prompt
  value `.export`. `readCamelYamlFiles()` filters exported copies out of the file list.
- **JBang command shape** (`jbang.prepareCommand`):
  `jbang "-Dcamel.jbang.version=<camel.version>" camel@apache/camel <cmd>`.
- **Run** = `run * [--max-messages=N] [--local-kamelet-dir=…] [--dev]`.
  **Export** = `export --fresh --directory=<path> [--local-kamelet-dir=…]`.
  **Runtime run** appends `&& mvn clean compile <quarkus:dev|spring-boot:run|camel:run> -f <path>`.
- Commands run in **named, reused terminals** (`jbang-run`, `runtime-run`, `deploy`);
  `execTerminalCommand` disposes the previous terminal with the same id.
- `karavan.run-project-runtime` refuses to run when `application.properties` is empty
  ("No runtime configured! Create application!").
- Naming rules (`utils.nameFromTitle` / `fileNameFromName`): non-alphanumerics → `-`,
  lowercased; kamelets get a `-<sink|source|action>` suffix and `.kamelet.yaml`, plain
  integrations get `.camel.yaml`.
- Dead code today: `src/maven.ts` (both functions), `utils.deleteFile`,
  `utils.toCliFilename`, `utils.setMinikubeEnvVariables`.

---

## 6. Build, run, verify

All commands run from `karavan-vscode/`.

```bash
npm install                 # deps (Node 24 in CI)
npm run compile             # webpack dev build of all three bundles (~15 s)
npm run package             # production build
npm run watch               # dev watch
npx vsce package            # produce the .vsix
```

Debugging: `.vscode/launch.json` provides **Extension** (desktop extension host),
**Attach** (port 9229) and **Run Web Extension in VS Code**. Build tasks come from
`.vscode/tasks.json` (`npm: watch`).

### Broken scripts — do not trust them as green/red signals

| Script | Status |
|---|---|
| `npm run lint` / `lint:fix` | **fails immediately.** ESLint 9.33 requires flat config; the repo only has `.eslintrc.json`. Migrating to `eslint.config.js` is a real, unclaimed task. |
| `npm run test-compile` / `npx tsc --noEmit -p .` | **exits 2 with ~20 pre-existing errors** (baseline below). |
| `npm test` / `pretest` | **cannot run** — points at `out/test/runTest.js`; there is no `out/` and no test sources. The project has **zero automated tests**. |

Pre-existing `tsc` baseline (not your regression — but don't add to it):

- `webpack.config.js` — `TsconfigPathsPlugin` "not constructable".
- `karavan-core/api/TopologyUtils.ts` ×3, `useRouteDesignerHook.tsx` ×3,
  `ProjectFunctionHook.tsx` ×4, `TopologyApi.tsx` ×3, `StringUtils.ts` ×5 — mostly
  `string | undefined` under `strict`.
- `TopologyApi.tsx:472` — `TopologyUtils.findTopologyAsyncApiNodes` missing from the
  vendored core (§2.4).
- `util/useFormUtil.tsx:19` — imports **`react-hook-form`, which is not in
  `package.json`**. It only survives because ts-loader runs with `transpileOnly: true`
  and nothing imports `useFormUtil`. Either add the dep or delete the file.

**Because of `transpileOnly: true`, a successful webpack build proves nothing about
types.** Practical verification loop:

1. `npm run compile` — must stay exit 0.
2. `npx tsc --noEmit -p . 2>&1 | grep -c "error TS"` — compare against the baseline.
3. Manual smoke test in the Extension Development Host (there is no test harness).

CI (`git show HEAD:.github/workflows/vscode.yml`) only runs `npm update && npm install`
then `vsce package` on Node 24 — no lint, no tests, no typecheck.

---

## 7. Conventions

- **Apache License header on every new source file.** Copy the 16-line ASF block used
  throughout `src/` and `webview/`; the license is Apache-2.0.
- TypeScript 5.9, `strict: true`, `target: es2022`, `jsx: "react"`.
- Import through the tsconfig path aliases, not relative climbs: `@karavan-core/*`,
  `@app/*`, `@features/*`, `@models/*`, `@shared/*`, `@stores/*`, `@util/*`, `@/*`.
- Extension host: `import { X } from "vscode"` in `extension.ts`, `designerView.ts`,
  `integrationView.ts`, `openapiView.ts`; `import * as vscode` in `topologyView.ts` and
  `helpView.ts`. Match the file you are editing.
- File I/O in `src/` goes through `utils.ts` (`workspace.fs`), never `node:fs`.
- Register disposables with `context.subscriptions.push(...)` (a few registrations in
  `activate()` skip this — follow the majority, not the omissions).
- Existing typos are part of the code's surface (`utils.parceYaml`,
  `utils.getRalativePath`, `getFileWithIntegnalConsumer`, `saveCode(…, yamFileName, …)`).
  Rename only as a deliberate, complete refactor.
- Indentation is inconsistent (4 spaces in most of `src/`, tabs in `integrationView.ts`,
  `topologyView.ts`, `helpView.ts`, `openapiView.ts`). Match the file; don't reformat.

---

## 8. Release / version bump

Version lives in `package.json` and is normally driven by the monorepo script
`git show HEAD:change_version.sh`, which bumps every module, rewrites
`camel.jbang.version=…` in `karavan-vscode/README.md` and `docs/VSCODE_HOWTO.md`, and
patches `TAG:` in the workflows. `CHANGELOG.md` is maintained by hand.

Current state to be aware of: `package.json` is **4.22.0** while `CHANGELOG.md`'s newest
entry and the `camel.version` default are **4.18.1** — the bump commit
(`0a2be04c bump version fo vscode to 4.22.0`) touched only the version.

---

## 9. Playbooks

**Add a command**
1. `contributes.commands` in `package.json` (+ `menus` entry, + `activationEvents`
   `onCommand:` to match the existing style).
2. `commands.registerCommand` in `activate()`; push the disposable.
3. Implement in the matching `src/*.ts` module; reuse `utils`/`exec`/`jbang` helpers.
4. `npm run compile`, then smoke test in the Extension Development Host.

**Add a designer ⇄ host round trip**
1. `vscode.postMessage({command: 'x', …})` in the webview.
2. New `case 'x'` in the panel's `onDidReceiveMessage` (`designerView.ts`).
3. If the host replies, add a `case` in `App.onMessage` plus a state field.
4. Remember `activate` → `getData {reread:true}` re-runs the whole load path.

**Support a new runtime or deploy target**
1. No new runtimes should be added

**Refresh Camel catalog / model**
1. Generated outside of this project

---

## 10. Guardrails

- Don't hand-edit `metadata/*`, `dist/*`, or the generated files in `webview/karavan-core`.
- Don't commit the monorepo deletions this pruned checkout reports.
- Don't claim "tests pass" — there are none. Don't claim "lint passes" — it can't run.
- A green `npm run compile` is a bundling result, not a type check (`transpileOnly`).
- The large metadata files make greps slow; scope searches with
  `--include='*.ts' --include='*.tsx'` and exclude `node_modules`, `dist`, `metadata`.
- Webview panels set `enableScripts: true` with `localResourceRoots` limited to `dist`.
  Keep it that way; don't widen the roots or inject remote script URLs into
  `webviewContent.ts`.
