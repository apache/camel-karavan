#!/usr/bin/env bash
set -euo pipefail

# 1. Resolve the script's directory so it works no matter where you call it from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

docker buildx build --load --no-cache --progress=plain --builder=multi-platform-builder -f Dockerfile.claude --platform linux/arm64 -t karavan-claude-sandbox:latst .