#!/usr/bin/env bash
# Release every publishable package sequentially.
# Packages are processed in dependency order (core-first) so that dependents
# are published after the packages they depend on.
#
# Usage:
#   bash scripts/release-all.sh [--dry-run]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${REPO_ROOT}/scripts/packages.sh"

DRY_RUN=${1:-}
FAILED=()

for pkg in "${PACKAGES[@]}"; do
  if bash "${REPO_ROOT}/scripts/release-package.sh" "${pkg}" ${DRY_RUN}; then
    echo "==> ${pkg}: done"
  else
    echo "==> ${pkg}: FAILED" >&2
    FAILED+=("${pkg}")
  fi
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "The following packages failed to release: ${FAILED[*]}" >&2
  exit 1
fi
