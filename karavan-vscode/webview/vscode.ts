let vscode;
if (typeof acquireVsCodeApi !== "undefined") {
  vscode = acquireVsCodeApi();
}

export default vscode;
