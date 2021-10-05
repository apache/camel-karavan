import * as React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";

export default () => {
  const html = renderToString(<App></App>);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="styleUri" rel="stylesheet" type="text/css"/>
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root">${html}</div>
        <script>
        </script>
    		<script src="scriptUri"></script>
      </body>
    </html>
  `;
};
