# Build Validation Tests

Misc / catch-all test suite with a deliberately gnarly project setup: old dependencies, legacy rollup plugins, and various edge-case configurations. Tests that the compiler handles real-world complexity gracefully.

## What it tests

- **Multiple output targets**: `www`, `dist`, `dist-hydrate-script`, `docs-json`, `docs-custom-elements-manifest`, `@stencil/react-output-target`
- **Legacy rollup plugins**: `linaria`, `rollup-plugin-css-only`, `rollup-plugin-node-builtins`
- **Old dependencies**: `lodash`, `lodash-es`, `video.js`, `file-saver`, etc.
- **Hydrate script**: End-to-end validation of SSR hydration
- **Export maps**: Validates package exports work correctly (CJS and ESM)
- **Compile-time benchmarks**: Performance regression tracking

## Test scripts

| Script | Description |
|--------|-------------|
| `test` | Playwright e2e tests |
| `test.dist` | Build + dist validation + hydrate validation + export map tests |
| `test.hydrate` | Hydrate script validation only |
| `benchmark` | Compile-time performance benchmarks |

## Notable config options

- `buildEs5: 'prod'` - ES5 builds for production
- `hydratedFlag` with custom attribute selector
- `extras.experimentalSlotFixes: true`
- `env` variables (`foo`, `HOST`)
- `globalScript` and `globalStyle`
