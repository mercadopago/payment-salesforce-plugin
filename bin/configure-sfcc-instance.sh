#!/usr/bin/env bash

set -euo pipefail

INSTANCE_HOST="${INSTANCE_HOST:-}"

if [ -z "$INSTANCE_HOST" ]; then
  echo "GitHub variable HOSTNAME is not set or empty." >&2
  exit 1
fi

echo "Configuring sfcc-ci default instance: $INSTANCE_HOST"
sfcc-ci instance:add "$INSTANCE_HOST" || echo "Instance may already be added, continuing..."
sfcc-ci instance:set "$INSTANCE_HOST"


