#!/usr/bin/env bash
# Release a single package via semantic-release.
# Must be called from the repository root.
#
# Usage:
#   bash scripts/release-package.sh <package-name> [--dry-run]
#
# Examples:
#   bash scripts/release-package.sh vue
#   bash scripts/release-package.sh core --dry-run

set -euo pipefail

PKG=${1:?Usage: release-package.sh <package-name> [--dry-run]}
PKG_DIR="packages/${PKG}"

if [ ! -d "${PKG_DIR}" ]; then
  echo "Error: package directory '${PKG_DIR}' not found." >&2
  exit 1
fi

if [ ! -f "${PKG_DIR}/.releaserc.json" ]; then
  echo "Error: '${PKG_DIR}/.releaserc.json' not found. Is '${PKG}' a publishable package?" >&2
  exit 1
fi

EXTRA_FLAGS=""
if [ "${2:-}" = "--dry-run" ]; then
  EXTRA_FLAGS="--dry-run"
fi

echo "==> Releasing ${PKG} (from ${PKG_DIR})..."
cd "${PKG_DIR}"
# shellcheck disable=SC2086
npx semantic-release ${EXTRA_FLAGS}
