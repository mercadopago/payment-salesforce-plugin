#!/usr/bin/env bash

SOURCE_DIRECTORY=$(pwd)

set -euo pipefail

echo "Checking required environment variables for publish-release..."

missing=0

check_var() {
  local var_name="$1"

  if [ -z "${!var_name-}" ]; then
    echo "Variable '${var_name}': NOT FOUND"
    missing=1
  else
    echo "Variable '${var_name}': FOUND"
  fi
}

check_var "OAUTH_CLIENT_ID"
check_var "OAUTH_CLIENT_SECRET"

if [ "$missing" -ne 0 ]; then
  echo "One or more required environment variables are missing. Skipping publish step."
  exit 0
fi

echo "Environment variable check finished."

sfcc-ci client:auth "$OAUTH_CLIENT_ID" "$OAUTH_CLIENT_SECRET"