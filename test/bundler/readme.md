# Bundler Tests

This directory contains test suites that are intended to test using Stencil components in a downstream application that is transformed by bundlers such as Vite.

## Files of Interest

### component-library/
This directory contains a basic component library, written in Stencil.
It is intended that applications found in directories adjacent to this one consume the library, using a bundler to test.

### vite-bundle-test/
This directory contains a basic application that is bundled using Vite.
It contains the Stencil component library found in the [component-library directory](#component-library).

### tests/
This directory contains Playwright test specs for testing the bundled applications.

### playwright.config.ts
This file contains the Playwright configuration for running tests.
It configures:
- Test execution across multiple browsers (Chrome, Firefox, Safari)
- Web server setup to serve the built Vite application
- Cross-platform testing support for Windows, macOS, and Linux
