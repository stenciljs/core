# Bundler Tests

This directory contains test suites that test using Stencil components in a downstream application transformed by bundlers such as Vite.

## Files of Interest

### component-library/

This directory contains a basic component library, written in Stencil.
It is intended that applications found in directories adjacent to this one consume the library, using a bundler to test.

### vite-bundle-test/

This directory contains a basic application that is bundled using Vite.
It contains the Stencil component library found in the [component-library directory](#component-library).

**Key files**:

- `vite-bundle.spec.ts` - Jest + Puppeteer test that verifies bundled components work in a real browser
- `tsconfig.json` - TypeScript configuration for tests
- `../jest.config.js` - Jest configuration using ts-jest preset

## Running Tests

```bash
# From test/bundler directory
npm run start  # Clean, build, and test (full workflow)

# Or run test only (after building)
npm run test
```

## How It Works

1. **Build**: Vite builds the application with Stencil components into the `dist/` folder
2. **Server**: Test starts a simple Node.js HTTP server serving the static `dist/` files
3. **Browser**: Puppeteer launches a real headless Chromium browser
4. **Navigate**: Browser navigates to the served application
5. **Test**: Test queries the Shadow DOM and verifies component content
6. **Cleanup**: Browser and server are closed after tests complete

## Test Approach

This approach mirrors what Karma was doing:

- ✅ **Real browser testing**: Uses Puppeteer's Chromium (not simulated DOM)
- ✅ **Static file serving**: Serves pre-built Vite bundles as-is
- ✅ **Shadow DOM testing**: Tests actual Shadow DOM implementation
- ✅ **Cross-platform**: Works on Windows, macOS, and Linux
- ✅ **Modern tooling**: Uses Jest 29 + Puppeteer 24
