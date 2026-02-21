# Global Script Test Suite

This test suite is built as a separate Stencil project alongside the main
Stencil project that we build for WebdriverIO.

The Stencil configuration for this project can be found at
`../global-script.stencil.config.ts`. The project is built with the
`build.global-script` command in the `package.json` for our WebdriverIO tests
(this is in turn called by the `build` script, ensuring that everything we need
is always built). In the `setup.ts` file used to load the Stencil project for
the WebdriverIO tests we selectively load the `global-script` bundle only when
running this test suite by checking the value of `__window.__wdioSpec__`.
