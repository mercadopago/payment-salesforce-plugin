#!/usr/bin/env bash

set -euo pipefail

SANDBOX_ID="${SANDBOX_ID:-}"

if [ -z "$SANDBOX_ID" ]; then
  echo "Environment variable SANDBOX_ID is not set or empty." >&2
  exit 1
fi

MAX_ATTEMPTS=30
SLEEP_SECONDS=20

SANDBOX_STATE=""

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "Checking sandbox state for ${SANDBOX_ID} (attempt ${attempt}/${MAX_ATTEMPTS})..."
  SANDBOX_OUTPUT=$(sfcc-ci sandbox:get -s "$SANDBOX_ID")
  SANDBOX_STATE=$(echo "$SANDBOX_OUTPUT" | awk -F':' '/[Ss]tate/ {gsub(/^[ \t]+/, "", $2); print tolower($2); exit}')

  if [ "$SANDBOX_STATE" = "started" ]; then
    echo "Sandbox ${SANDBOX_ID} is started."
    break
  fi

  echo "Sandbox ${SANDBOX_ID} not started yet (state='${SANDBOX_STATE}'). Waiting ${SLEEP_SECONDS}s before retry..."
  sleep "$SLEEP_SECONDS"
done

if [ "$SANDBOX_STATE" != "started" ]; then
  echo "Sandbox ${SANDBOX_ID} did not reach 'started' state within the expected time." >&2
  exit 1
fi


