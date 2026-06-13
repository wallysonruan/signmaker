.PHONY: lint typecheck test commitlint build release ci install

# ─── Validation ──────────────────────────────────────────────────────────────

lint:
	npm run typecheck --workspace=packages/vue
	npm run typecheck --workspace=packages/react

typecheck:
	npm run typecheck --workspace=packages/vue
	npm run typecheck --workspace=packages/react

test:
	npm test

commitlint:
	bash scripts/commitlint.sh

# ─── Build ────────────────────────────────────────────────────────────────────

build:
	npm run build --workspace=packages/fsw
	npm run build --workspace=packages/layout
	npm run build --workspace=packages/editor
	npm run build --workspace=packages/renderer
	npm run build --workspace=packages/vue

# ─── Release ─────────────────────────────────────────────────────────────────

release: build
	npx semantic-release

# ─── Composite ───────────────────────────────────────────────────────────────

# Full validation suite — must match what CI runs.
ci: lint typecheck test commitlint

# ─── Setup ───────────────────────────────────────────────────────────────────

install:
	npm install
	npx lefthook install
