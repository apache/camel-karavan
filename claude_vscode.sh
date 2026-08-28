#!/bin/bash

docker run -it --rm \
  --name claude-sandbox \
  -v "$(pwd)/docs:/app/docs" \
  -v "$(pwd)/karavan-vscode:/app/karavan-vscode" \
  -v "$(pwd)/.github/workflow/vscode.yml:/app/.github/workflow/vscode.yml" \
  -v "$(pwd)/.git:/app/.git:ro" \
  -v claude-config:/home/default \
  -e ANTHROPIC_API_KEY \
  claude-sandbox \
  --dangerously-skip-permissions \
  "Read /app/karavan-vscode/.task.md. Execute the tasks described within, make the necessary code changes, and generate a concise summary report saved to /app/karavan-vscode/.task_report.md. Exit the process when you are completely finished."