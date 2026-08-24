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
// `acquireVsCodeApi` only exists inside a VS Code webview. The prerender build runs the
// same components under Node, so fall back to a no-op implementation instead of exporting
// `undefined` (which every caller would otherwise have to null-check).
const noopVsCodeApi: VsCodeApi = {
  postMessage: () => undefined,
  getState: () => undefined,
  setState: (state) => state,
};

const vscode: VsCodeApi =
  typeof acquireVsCodeApi !== "undefined" ? acquireVsCodeApi() : noopVsCodeApi;

export default vscode;
