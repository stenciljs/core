# Test Orchestration

Each test directory is a standalone project with its own `package.json` and `test` script. In CI, each directory maps to one job.

## Directory Structure

```
tests/
├── runtime/           # Component runtime behavior (@stencil/vitest)
├── ssr/               # Server-side rendering (@stencil/playwright)
├── special-config/    # Specific config option tests
│   ├── external-runtime/      # externalRuntime: true
│   └── invisible-prehydration/ # invisiblePrehydration: false
├── integration/       # Full app integration tests
│   ├── build-validation/  # Complex build config validation
│   ├── bundler/           # Vite bundling integration
│   ├── ionic-app/         # Stencil + Ionic integration
│   └── prerender/         # prerenderConfig option
├── build/             # Build output validation
│   ├── bundle-size/   # Bundle size regression check
│   ├── copy-task/     # Copy task validation
│   ├── docs-json/     # JSON docs generation
│   ├── docs-readme/   # README docs generation
│   └── type-tests/    # JSX type checking
└── perf/              # Performance benchmarks (scheduled)
    ├── build-benchmark/
    ├── performance/
    └── runtime-benchmark/
```

## Running Tests

All packages follow the naming convention `@stencil-core-tests/<category>` for parent packages and `@stencil-core-tests/<category>-<name>` for child packages.

```bash
# Run all tests in a category (parent packages)
pnpm --filter @stencil-core-tests/runtime test
pnpm --filter @stencil-core-tests/ssr test
pnpm --filter @stencil-core-tests/build test           # runs all build-* packages
pnpm --filter @stencil-core-tests/integration test     # runs all integration-* packages
pnpm --filter @stencil-core-tests/special-config test  # runs all special-config-* packages
pnpm --filter @stencil-core-tests/perf test            # runs all perf-* packages

# Run a specific child package
pnpm --filter @stencil-core-tests/build-type-tests test
pnpm --filter @stencil-core-tests/integration-prerender test
pnpm --filter @stencil-core-tests/special-config-external-runtime test

# Run from directory
cd tests/runtime && pnpm test
```

## Test Runners

| Directory | Runner | Pre-build needed? |
|-----------|--------|-------------------|
| runtime/ | @stencil/vitest | No (handled by stencil-test) |
| ssr/ | @stencil/playwright | No (handled by stencil-test) |
| special-config/* | @stencil/playwright | Build in test script |
| integration/* | @stencil/playwright | Build in test script |
| build/* | Custom | Yes (in test script) |
| perf/* | Custom | Yes |

## Writing Tests

### @stencil/vitest (runtime/)

```tsx
import { describe, it, expect, render, h } from '@stencil/vitest';

describe('my-component', () => {
  it('renders', async () => {
    const { root } = await render(<my-component />);
    expect(root).toHaveTextContent('Hello');
  });
});
```

### @stencil/playwright (ssr/, integration/)

```ts
import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('my-component', () => {
  test('renders', async ({ page }) => {
    await page.goto('/');
    const el = page.locator('my-component');
    await expect(el).toBeVisible();
  });
});
```

## CI Jobs

Each test directory = 1 CI job. Jobs can run in parallel.

| Job | Directory | Frequency |
|-----|-----------|-----------|
| test-runtime | runtime/ | Every PR |
| test-ssr | ssr/ | Every PR |
| test-external-runtime | special-config/external-runtime/ | Every PR |
| test-invisible-prehydration | special-config/invisible-prehydration/ | Every PR |
| test-build-validation | integration/build-validation/ | Every PR |
| test-bundler | integration/bundler/ | Every PR |
| test-ionic | integration/ionic-app/ | Every PR |
| test-prerender | integration/prerender/ | Every PR |
| test-bundle-size | build/bundle-size/ | Every PR |
| test-copy-task | build/copy-task/ | Every PR |
| test-docs-json | build/docs-json/ | Every PR |
| test-docs-readme | build/docs-readme/ | Every PR |
| test-type-tests | build/type-tests/ | Every PR |
| perf-build | perf/build-benchmark/ | Scheduled |
| perf-runtime | perf/runtime-benchmark/ | Scheduled |
| perf-general | perf/performance/ | Scheduled |
