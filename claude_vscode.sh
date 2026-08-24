#!/bin/bash

docker run -it --rm \
  --name claude-sandbox \
  -v "$(pwd)/docs:/karavan/docs" \
  -v "$(pwd)/karavan-vscode:/karavan/karavan-vscode" \
  -v "$(pwd)/.github/workflow/vscode.yml:/karavan/.github/workflow/vscode.yml" \
  -v "$(pwd)/.git:/karavan/.git:ro" \
  -v claude-config:/home/default \
  -e ANTHROPIC_API_KEY \
  claude-sandbox \
  --dangerously-skip-permissions \
  "Read /karavan/karavan-vscode/task.md. Execute the tasks described within, make the necessary code changes, and generate a concise summary report saved to /karavan/karavan-vscode/.task_report.md. Exit the process when you are completely finished."