#!/usr/bin/env bash
# Validate only commits introduced on the current branch relative to the base
# branch (default: main). This avoids flagging pre-existing history in forks.
#
# Usage:
#   bash scripts/commitlint.sh           # base = origin/main
#   BASE=origin/develop bash scripts/commitlint.sh
set -euo pipefail

BASE="${BASE:-origin/main}"

git fetch origin main --quiet 2>/dev/null || true

FROM=$(git merge-base HEAD "$BASE" 2>/dev/null || echo "")

if [ -z "$FROM" ]; then
  echo "Could not find merge-base with $BASE; skipping commitlint."
  exit 0
fi

COMMIT_COUNT=$(git rev-list --count "$FROM"..HEAD)

if [ "$COMMIT_COUNT" -eq 0 ]; then
  echo "No new commits relative to $BASE; nothing to validate."
  exit 0
fi

echo "Validating $COMMIT_COUNT commit(s) from merge-base of $BASE to HEAD..."
npx commitlint --from "$FROM" --to HEAD --verbose
