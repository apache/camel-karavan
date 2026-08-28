#!/bin/bash

docker run -it --rm --network=karavan \
  --name claude-sandbox \
  -v "$(pwd)/docs:/app/docs" \
  -v "$(pwd)/karavan-app:/app/karavan-app" \
  -v "$(pwd)/karavan-generator:/app/karavan-generator" \
  -v "$(pwd)/.git:/app/.git:ro" \
  -v claude-config:/home/default \
  -e ANTHROPIC_API_KEY \
  claude-sandbox \
  --dangerously-skip-permissions \
  "Read /app/karavan-app/.task.md. Execute the tasks described within, make the necessary code changes, and generate a concise summary report saved to /app/karavan-app/.task_report.md. Exit the process when you are completely finished."