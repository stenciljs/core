# Bundler Tests

Tests that verify Stencil components work correctly when consumed by downstream applications using bundlers.

## Structure

### component-library/
A minimal Stencil component library used as the test subject.

### vite-bundle-test/
An application that imports and bundles the component library using Vite.

### playwright.config.ts
Playwright configuration for running browser tests against the built output.

## Running Tests

```bash
# Full test run (clean, build, test)
npm start

# Or step by step:
npm run build    # Build component library + Vite app
npm run test     # Run Playwright tests
```
