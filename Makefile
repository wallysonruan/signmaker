# Publishable packages — derived from scripts/packages.sh (single source of truth).
PACKAGES := $(shell bash -c 'source scripts/packages.sh && echo "$${PACKAGES[*]}"')

RELEASE_TARGETS     := $(addprefix release-,$(PACKAGES))
RELEASE_DRY_TARGETS := $(addprefix release-dry-run-,$(PACKAGES))

.PHONY: lint typecheck test commitlint build \
        release-all release-all-dry-run \
        $(RELEASE_TARGETS) $(RELEASE_DRY_TARGETS) \
        ci install

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

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

# Full validation suite — must match what CI runs.
ci: lint typecheck test commitlint

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

build:
	npm run build --workspace=packages/fsw
	npm run build --workspace=packages/layout
	npm run build --workspace=packages/editor
	npm run build --workspace=packages/renderer
	npm run build --workspace=packages/vue

# ---------------------------------------------------------------------------
# Release — per-package
# ---------------------------------------------------------------------------

# Release every publishable package (dependency order preserved by packages.sh).
release-all: build
	bash scripts/release-all.sh

# Dry-run every package (no tags, no npm publish, no git commits).
release-all-dry-run:
	bash scripts/release-all.sh --dry-run

# release-<pkg>  — release a single package, e.g. make release-vue
$(RELEASE_TARGETS): release-%: build
	bash scripts/release-package.sh $*

# release-dry-run-<pkg>  — local validation without side-effects
$(RELEASE_DRY_TARGETS): release-dry-run-%:
	bash scripts/release-package.sh $* --dry-run

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

install:
	npm install
	npx lefthook install
