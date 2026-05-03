#!/bin/bash
# Async post-edit hook: runs tests or lint for the edited module.
# Receives hook context via stdin as JSON.

set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

if [ -z "$FILE" ]; then
  exit 0
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

if [[ "$FILE" == *"/order-service/"* ]]; then
  echo "[run-checks] Running order-service tests..."
  ./gradlew :order-service:test --continue 2>&1 | tail -30
elif [[ "$FILE" == *"/product-service/"* ]]; then
  echo "[run-checks] Running product-service tests..."
  ./gradlew :product-service:test --continue 2>&1 | tail -30
elif [[ "$FILE" == *"/payment-service/"* ]]; then
  echo "[run-checks] Running payment-service tests..."
  ./gradlew :payment-service:test --continue 2>&1 | tail -30
elif [[ "$FILE" == *"/api-gateway/"* ]]; then
  echo "[run-checks] Running api-gateway tests..."
  ./gradlew :api-gateway:test --continue 2>&1 | tail -30
elif [[ "$FILE" == *"/react-ui/"* ]]; then
  echo "[run-checks] Running React lint..."
  cd react-ui && npm run lint 2>&1
else
  echo "[run-checks] No checks configured for: $FILE"
fi
