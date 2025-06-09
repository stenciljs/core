# vite-bundle-test

This directory contains test(s) to verify that an application that is bundled using [Vite](https://vitejs.dev/) can
successfully load a component library created using Stencil's `dist` output target.

## scripts

This library contains three NPM scripts:

- `build` - builds the project using Vite. Requires that the [web component library](../component-library/README.md) be
built first
- `clean` - removes previously created build artifacts
- `start` - starts up a local dev server to validate the application looks/behaves as expected. 
Note this is done in a local dev-server; the artifacts generated may not match those from the `build` script exactly/ 
should only be used for smoke testing
