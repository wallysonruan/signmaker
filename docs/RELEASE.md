# Release Architecture

Each publishable package in this monorepo has an independent semantic-release
lifecycle. A commit touching only `packages/vue` triggers only a `vue` release;
a commit touching only `packages/editor` triggers only an `editor` release.

---

## Package registry

The canonical list of publishable packages lives in **`scripts/packages.sh`**:

```bash
PACKAGES=(fsw layout editor renderer vue react web-components)
```

Every script and the Makefile derive their package list from this file.
To add a new package, append its directory name here and create a
`packages/<name>/.releaserc.json` (see [Adding a new package](#adding-a-new-package)).

---

## Tag strategy

Tags are namespaced by package to prevent collision:

| Package          | Tag format              | Example            |
|------------------|-------------------------|--------------------|
| `fsw`            | `fsw-v<version>`        | `fsw-v1.3.0`       |
| `layout`         | `layout-v<version>`     | `layout-v0.2.1`    |
| `editor`         | `editor-v<version>`     | `editor-v2.0.0`    |
| `renderer`       | `renderer-v<version>`   | `renderer-v1.1.0`  |
| `vue`            | `vue-v<version>`        | `vue-v1.2.0`       |
| `react`          | `react-v<version>`      | `react-v0.4.1`     |
| `web-components` | `web-components-v<ver>` | `web-components-v0.1.0` |

semantic-release uses the `tagFormat` field in each package's `.releaserc.json`
to find the previous release of that package and to create the new tag.

---

## Commit filtering

Version calculation is **scope-based**. This works reliably because
commitlint enforces that every commit carries a scope matching one of the
valid package names (configured in `commitlint.config.cjs`).

The filtering is implemented in **`scripts/commit-filter-plugin.cjs`** — a
thin wrapper around `@semantic-release/commit-analyzer` and
`@semantic-release/release-notes-generator` that strips commits whose scope
does not match the package being released before passing them to the upstream
analyzers.

```
feat(vue): add toolbar composable     → counted for vue, ignored by all others
fix(editor): correct undo stack       → counted for editor, ignored by all others
chore(deps): upgrade vite             → no package scope → ignored by all packages
```

No new npm dependencies are required; the plugin reuses packages already
installed by `semantic-release`.

### Limitation

Scope-based filtering relies on developer discipline (scope = package name).
commitlint enforces valid scopes at commit time, so drift is caught before it
reaches `main`. However, a commit with no scope (e.g. a plain `chore:`)
will not contribute to any package release. This is intentional — cross-cutting
changes that don't touch a specific package should not trigger releases.

---

## How version calculation works

For each package:

1. semantic-release locates the most recent tag matching `<pkg>-v*`.
2. It retrieves all commits between that tag and `HEAD`.
3. `commit-filter-plugin.cjs` removes commits whose scope differs from the
   package's scope.
4. `@semantic-release/commit-analyzer` determines the release type from the
   remaining commits (`feat` → minor, `fix`/`perf`/`revert` → patch, breaking
   change → major).
5. If no releasable commits remain, semantic-release exits without publishing.
6. Otherwise it: bumps the version in `package.json`, generates `CHANGELOG.md`,
   publishes to npm, creates a GitHub release, and pushes a `[skip ci]` commit
   back to `main`.

---

## Release flows

### CI (automatic, runs on every push to `main`)

```
push → main
  └── test job (make ci)
        └── release job (make release-all)
              ├── make build
              └── scripts/release-all.sh
                    ├── scripts/release-package.sh fsw
                    ├── scripts/release-package.sh layout
                    ├── scripts/release-package.sh editor
                    ├── scripts/release-package.sh renderer
                    ├── scripts/release-package.sh vue
                    ├── scripts/release-package.sh react
                    └── scripts/release-package.sh web-components
```

Packages are processed in dependency order as defined in `scripts/packages.sh`.
Each invocation runs `npx semantic-release` from inside the package directory,
reading that package's `.releaserc.json`.

### Local release (manual, matches CI exactly)

```bash
# Release every package
make release-all

# Release a single package
make release-vue
make release-editor

# Dry run (no tags, no publish, no git commits) — safe to run anytime
make release-dry-run-vue
make release-all-dry-run
```

Set `GITHUB_TOKEN` and `NPM_TOKEN` in your shell before running locally:

```bash
export GITHUB_TOKEN=ghp_...
export NPM_TOKEN=npm_...
make release-vue
```

---

## Adding a new publishable package

1. **Register it** — append the directory name to `PACKAGES` in `scripts/packages.sh`.

2. **Add a commitlint scope** — add the name to the `scope.enum` array in
   `commitlint.config.cjs`.

3. **Create a release config** — copy any existing `packages/<name>/.releaserc.json`
   and update `tagFormat`, the `scope` field in the plugin config, and the
   `message` template in `@semantic-release/git`.

4. **Verify** — run `make release-dry-run-<name>` to confirm the config resolves
   correctly before merging.

The Makefile targets `release-<name>` and `release-dry-run-<name>` are generated
automatically from `scripts/packages.sh` — no Makefile edits required.

---

## File map

| File | Purpose |
|------|---------|
| `scripts/packages.sh` | Single source of truth for publishable package names |
| `scripts/commit-filter-plugin.cjs` | Scope-based commit filter for semantic-release |
| `scripts/release-package.sh` | Runs semantic-release for one package |
| `scripts/release-all.sh` | Runs `release-package.sh` for every package in order |
| `packages/<name>/.releaserc.json` | Per-package semantic-release configuration |
| `Makefile` | `release-all`, `release-<pkg>`, `release-dry-run-<pkg>` targets |
| `.github/workflows/ci.yml` | Orchestrates `make ci` + `make release-all` |
