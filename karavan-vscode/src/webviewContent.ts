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

import { ExtensionContext, Uri, Webview } from "vscode";


export function getWebviewContent(context: ExtensionContext, webview: Webview): string {
    const styleUri = getUri(webview, context.extensionUri, "/dist/main.css").toString()
        const scriptUri = getUri(webview, context.extensionUri, "/dist/webview.js").toString()
        
        return `<!DOCTYPE html>
        <html lang="en">
        
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link href="${styleUri}" rel="stylesheet" type="text/css" />
        </head>
        
        <body>
          <noscript>You need to enable JavaScript to run this app.</noscript>
          <div id="root">
            <div class="pf-c-page karavan">
              <main class="pf-c-page__main" tabindex="-1">
                <section class="pf-c-page__main-section pf-m-dark-200 loading-page"><svg
                    class="pf-c-spinner pf-m-xl progress-stepper" role="progressbar" aria-valuetext="Loading..."
                    viewBox="0 0 100 100" style="--pf-v5-c-spinner--diameter:80px" aria-label="Loading...">
                    <circle class="pf-c-spinner__path" cx="50" cy="50" r="45" fill="none"></circle>
                  </svg></section>
              </main>
            </div>
          </div>
          <script>
          </script>
          <script src="${scriptUri}"></script>
        </body>
        
        </html>`;
}

function getUri(webview: Webview, extensionUri: Uri, path: string) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, path));
}