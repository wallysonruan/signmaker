.PHONY: lint typecheck test commitlint build release ci install

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

build:
	npm run build --workspace=packages/fsw
	npm run build --workspace=packages/layout
	npm run build --workspace=packages/editor
	npm run build --workspace=packages/renderer
	npm run build --workspace=packages/vue

release: build
	npx semantic-release

# Full validation suite — must match what CI runs.
ci: lint typecheck test commitlint

install:
	npm install
	npx lefthook install
