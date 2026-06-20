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
