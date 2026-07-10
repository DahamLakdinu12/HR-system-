#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ARTIFACTS_DIR="${ROOT_DIR}/artifacts"

cd "$ROOT_DIR"

npm --prefix frontend run build
dotnet publish backend/src/HRIncrement.Api/HRIncrement.Api.csproj -c Release -o "${ARTIFACTS_DIR}/backend-publish"

rm -rf "${ARTIFACTS_DIR}/frontend-dist"
mkdir -p "${ARTIFACTS_DIR}/frontend-dist"
cp -R frontend/dist/. "${ARTIFACTS_DIR}/frontend-dist/"

echo "Build output created under ${ARTIFACTS_DIR}."
