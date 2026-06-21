#!/usr/bin/env bash
# Deploys app/dist/ to the gh-pages branch using git worktree.
# Run via: make deploy-pages
# Requires: app/dist/ to exist (run make build-app first).
set -euo pipefail

DIST_DIR="app/dist"
DEPLOY_BRANCH="gh-pages"
WORKTREE_DIR=$(mktemp -d)

if [[ ! -d "$DIST_DIR" ]]; then
  echo "Error: '$DIST_DIR' not found. Run 'make build-app' first." >&2
  exit 1
fi

cleanup() {
  git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || true
}
trap cleanup EXIT

git config user.name  "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Fetch gh-pages if it exists remotely; ignore errors when it does not.
git fetch origin "$DEPLOY_BRANCH:$DEPLOY_BRANCH" 2>/dev/null || true

if git show-ref --verify --quiet "refs/heads/$DEPLOY_BRANCH"; then
  git worktree add "$WORKTREE_DIR" "$DEPLOY_BRANCH"
else
  git worktree add --orphan -b "$DEPLOY_BRANCH" "$WORKTREE_DIR"
fi

# Replace all content with the fresh build output.
find "$WORKTREE_DIR" -mindepth 1 ! -path "$WORKTREE_DIR/.git*" -delete
cp -r "$DIST_DIR/." "$WORKTREE_DIR/"

(
  cd "$WORKTREE_DIR"
  git add --all
  if git diff --cached --quiet; then
    echo "Nothing to deploy: gh-pages is already up to date."
    exit 0
  fi
  git commit --message "chore(ci): deploy app to gh-pages [skip ci]"
  git push origin "$DEPLOY_BRANCH" --force
)

echo "Deployed successfully to gh-pages."
