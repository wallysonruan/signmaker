# AGENTS.md — Agent instructions for all AI tools

Instructions for AI coding agents (Claude Code, GitHub Copilot, Cursor, Continue, etc.)
working in this repository.

---

## Development commands

```bash
make install     # install deps and activate git hooks (run once after cloning)
npm test         # run all Jest tests across all packages
make typecheck   # vue-tsc --noEmit (Vue package only)
make build       # build all packages in dependency order
make ci          # full validation: lint, typecheck, test, commitlint
make commitlint  # validate commit messages on the current branch vs origin/main
```

---

## Commit conventions

This repository enforces [Conventional Commits](https://www.conventionalcommits.org/).
Every commit message **must** match:

```
<type>(<scope>): <description>
```

**Valid scopes** — these are checked by `commitlint` on every commit and on every push:

| Scope | Maps to |
|---|---|
| `fsw` | `packages/fsw` — FSW/SWU engine |
| `layout` | `packages/layout` — coordinate math |
| `editor` | `packages/editor` — state machine, commands, history |
| `renderer` | `packages/renderer` — SVG rendering |
| `vue` | `packages/vue` — Vue 3 composables and components |
| `app` | `app/` — demo application |
| `ci` | CI pipelines, Makefile, scripts, git hooks |
| `release` | Release configuration and scripts |
| `deps` | Dependency upgrades |

Any other scope will fail `commitlint` and block CI.

**Valid types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`

### Scopes and semantic-release

Only commits scoped to a **package name** (`fsw`, `layout`, `editor`, `renderer`, `vue`) trigger
a release for that package. The other scopes (`app`, `ci`, `release`, `deps`) are valid for
commitlint but are **invisible to semantic-release** — no new npm version will be published.

Concretely, `scripts/commit-filter-plugin.cjs` filters the commit list for each package down to
only those whose scope matches the package name before passing them to `@semantic-release/commit-analyzer`.
A commit like `fix(release): …` is valid git history but produces **no release** for any package.

**Rule of thumb:** if your change affects a package's published behaviour or metadata (source files,
`package.json` fields, `tsconfig.json`, vite config), commit it under the package scope so
semantic-release sees it:

```
fix(fsw): …      → patch release of @wallysonruan/signmaker-fsw-engine
feat(vue): …     → minor release of @wallysonruan/signmaker-vue
fix(ci): …       → NO release (ci scope is filtered out)
fix(release): …  → NO release (release scope is filtered out)
```

If you need to touch multiple packages in one logical change, split into one commit per package.

> **Squash-merge warning**: GitHub squash-merges collapse all commits into one whose message
> is the PR title. If the PR title has no package scope (e.g. `fix: update multiple packages`),
> semantic-release will see 0 matching commits and publish nothing. Either:
> - Use a **rebase merge** so individual commit messages land on `main` verbatim, or
> - Push per-package commits **directly to `main`** (bypassing the PR squash), or
> - Give the PR a scoped title that matches exactly one package (only works for single-package PRs).

---

## Build artefacts — never commit

- `*.tsbuildinfo` — TypeScript incremental build cache; each package has a `.gitignore` that excludes it
- `dist/` — compiled output
- `coverage/` — Jest coverage reports
- `node_modules/` — npm dependencies

If the git stop-hook reports uncommitted changes in these files, add them to the nearest
package-level `.gitignore` rather than committing them.

---

## Git safety rules

- **Never** use `--no-verify` or `--no-gpg-sign` on git commands
- **Never** force-push to `main`
- **Never** use `git rebase -i` (interactive; requires a TTY)
- Always commit only files relevant to the change; stage by name, not `git add -A`

---

## Scope lifecycle — when removing a package

Removing a package invalidates its commit scope retroactively against the current
`commitlint.config.cjs`. Follow these steps to avoid CI failures:

1. **Check branch history first:**
   ```bash
   git log --oneline "$(git merge-base HEAD origin/main)"..HEAD
   ```
   Look for any commits using the scope of the package you are about to remove.

2. **Fix any commits that use the old scope** before changing `commitlint.config.cjs`.
   Amend the most-recent such commit, or ask the user how to handle earlier ones.

3. **Remove the scope** from `commitlint.config.cjs`.

4. **Verify locally:**
   ```bash
   make commitlint
   ```
   Must exit 0 before pushing.
