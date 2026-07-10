#!/usr/bin/env bash
set -euo pipefail

missing=()

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    missing+=("$1")
  fi
}

require_tool dotnet
require_tool node
require_tool npm

echo "Checking HR System development prerequisites..."

if command -v dotnet >/dev/null 2>&1; then
  dotnet --version
fi

if command -v node >/dev/null 2>&1; then
  node --version
fi

if command -v npm >/dev/null 2>&1; then
  npm --version
fi

if command -v docker >/dev/null 2>&1; then
  docker --version
else
  echo "Docker not found. This is fine only if you use an existing SQL Server."
fi

if [ "${#missing[@]}" -gt 0 ]; then
  echo "Missing required tools: ${missing[*]}"
  exit 1
fi

echo "Prerequisite check passed."
