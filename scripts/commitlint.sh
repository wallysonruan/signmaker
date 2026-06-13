#!/usr/bin/env bash
# Validate commit messages from the last tag (or repo root) to HEAD.
set -euo pipefail

LAST_TAG=$(git tag --sort=version:refname | tail -n1)

if [ -z "$LAST_TAG" ]; then
  FROM=$(git rev-list --max-parents=0 HEAD)
else
  FROM="$LAST_TAG"
fi

echo "Validating commits from $FROM to HEAD..."
npx commitlint --from "$FROM" --to HEAD --verbose
