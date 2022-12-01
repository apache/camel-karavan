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
                    viewBox="0 0 100 100" style="--pf-c-spinner--diameter:80px" aria-label="Loading...">
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