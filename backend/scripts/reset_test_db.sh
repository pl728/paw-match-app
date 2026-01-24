#!/usr/bin/env bash
set -euo pipefail

if [ -z "${TEST_DATABASE_URL:-}" ]; then
  echo "TEST_DATABASE_URL is required (e.g., postgres://user:pass@localhost:5432/paw_match_test)"
  exit 1
fi

python - <<'PY'
import os
import urllib.parse
import subprocess

url = os.environ['TEST_DATABASE_URL']
parsed = urllib.parse.urlparse(url)

host = parsed.hostname or 'localhost'
port = parsed.port or 5432
user = parsed.username or ''
password = parsed.password or ''
db = parsed.path.lstrip('/')

if not db:
    raise SystemExit('TEST_DATABASE_URL must include a database name')

env = os.environ.copy()
if password:
    env['PGPASSWORD'] = password

check_cmd = [
    'psql',
    '-h', host,
    '-p', str(port),
    '-U', user,
    '-d', 'postgres',
    '-tAc',
    f"SELECT 1 FROM pg_database WHERE datname = '{db}'"
]

result = subprocess.run(check_cmd, env=env, capture_output=True, text=True)
exists = result.stdout.strip() == '1'

if not exists:
    create_cmd = [
        'createdb',
        '-h', host,
        '-p', str(port),
        '-U', user,
        db
    ]
    subprocess.run(create_cmd, env=env, check=True)
PY

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

psql "${TEST_DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
SQL

psql "${TEST_DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${ROOT_DIR}/db/schema.sql"
psql "${TEST_DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${ROOT_DIR}/db/seed.sql"

echo "Test database reset complete."
