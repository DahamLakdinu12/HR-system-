#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "Missing .env file. Copy .env.example to .env and set workbook paths first."
  exit 1
fi

database/scripts/import_hr_staff.sh
