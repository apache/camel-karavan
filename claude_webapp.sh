#!/bin/bash

docker run -it --rm --network=karavan \
  --name claude-sandbox \
  -v "$(pwd)/docs:/karavan/docs" \
  -v "$(pwd)/karavan-app:/karavan/karavan-app" \
  -v "$(pwd)/karavan-generator:/karavan/karavan-generator" \
  -v "$(pwd)/.git:/karavan/.git:ro" \
  -v claude-config:/home/default \
  -e ANTHROPIC_API_KEY \
  claude-sandbox \
  --dangerously-skip-permissions \
  "Read /karavan/karavan-app/.task.md. Execute the tasks described within, make the necessary code changes, and generate a concise summary report saved to /karavan/karavan-app/.task_report.md. Exit the process when you are completely finished."