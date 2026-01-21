#!/usr/bin/env bash
set -euo pipefail

if [ -z "${TEST_DATABASE_URL:-}" ]; then
  echo "TEST_DATABASE_URL is required (e.g., postgres://user:pass@localhost:5432/paw_match_test)"
  exit 1
fi

export DATABASE_URL="${TEST_DATABASE_URL}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${SCRIPT_DIR}/reset_test_db.sh"

npx jest
