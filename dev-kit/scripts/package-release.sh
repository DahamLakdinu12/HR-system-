#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RELEASE_DIR="${ROOT_DIR}/artifacts/hr-system-release"

cd "$ROOT_DIR"

"${SCRIPT_DIR}/build-all.sh"

rm -rf "$RELEASE_DIR"
mkdir -p "${RELEASE_DIR}/backend" "${RELEASE_DIR}/frontend" "${RELEASE_DIR}/docs" "${RELEASE_DIR}/env"

cp -R artifacts/backend-publish/. "${RELEASE_DIR}/backend/"
cp -R artifacts/frontend-dist/. "${RELEASE_DIR}/frontend/"
cp dev-kit/SERVER_SETUP.md "${RELEASE_DIR}/SERVER_SETUP.md"
cp docs/operations/running-the-system.md "${RELEASE_DIR}/docs/running-the-system.md"
cp docs/deployment/configuration.md "${RELEASE_DIR}/docs/configuration.md"
cp .env.example "${RELEASE_DIR}/env/.env.example"
cp dev-kit/env/backend.environment.template "${RELEASE_DIR}/env/backend.environment.template"
cp dev-kit/env/frontend.env.local.template "${RELEASE_DIR}/env/frontend.env.local.template"

echo "Release package created at ${RELEASE_DIR}."
