#!/usr/bin/env bash

set -euo pipefail

echo "Getting active code version..."

echo "Running 'sfcc-ci code:list' (table output)..."
sfcc-ci code:list || { echo "Error running 'sfcc-ci code:list'"; exit 1; }

echo "Running 'sfcc-ci code:list -j' (JSON output only, no jq)..."
sfcc-ci code:list -j
CODE_LIST_JSON_EXIT=$?
echo "Exit code of 'sfcc-ci code:list -j': $CODE_LIST_JSON_EXIT"

if [ "$CODE_LIST_JSON_EXIT" -ne 0 ]; then
  echo "'sfcc-ci code:list -j' failed, cannot proceed to jq parsing." >&2
  exit 1
fi

echo "Parsing JSON with jq to get active version..."
ACTIVE_VERSION=$(sfcc-ci code:list -j | jq -r '.data[] | select(.active == true) | .id')
echo "ACTIVE_VERSION=$ACTIVE_VERSION"

if [ -z "$ACTIVE_VERSION" ] || [ "$ACTIVE_VERSION" = "null" ]; then
  echo "No active code version found even after sandbox is started." >&2
  exit 1
fi

echo "Active version found: $ACTIVE_VERSION"
echo "active_version=$ACTIVE_VERSION" >> "$GITHUB_OUTPUT"


