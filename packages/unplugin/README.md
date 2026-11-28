# @stencil/unplugin

Universal bundler plugin for Stencil components — supports Vite, Rollup, Webpack, esbuild, and Rspack.

Lets you import and use Stencil components directly in any bundler without a full Stencil build pipeline. Each `.tsx` component file is transpiled on-the-fly via `transpileSync` into a self-registering custom element.

## Install

```bash
npm install --save-dev @stencil/unplugin @stencil/core
```

Optional CSS preprocessors (install only what you need — the plugin silently skips any that aren't present):

```bash
npm install --save-dev sass          # .scss / .sass
npm install --save-dev less          # .less
npm install --save-dev postcss postcss-load-config  # PostCSS via postcss.config.*
npm install --save-dev lightningcss  # syntax lowering, vendor prefixes, minification
```

## Usage

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { stencilVite } from '@stencil/unplugin';

export default defineConfig({
  plugins: [stencilVite()],
});
```

### Rollup

```ts
// rollup.config.js
import { stencilRollup } from '@stencil/unplugin';

export default {
  plugins: [stencilRollup()],
};
```

### Webpack

```js
// webpack.config.js
const { stencilWebpack } = require('@stencil/unplugin');

module.exports = {
  plugins: [stencilWebpack()],
};
```

### esbuild

```ts
import { build } from 'esbuild';
import { stencilEsbuild } from '@stencil/unplugin';

await build({
  plugins: [stencilEsbuild()],
});
```

### Rspack

```js
// rspack.config.js
const { stencilRspack } = require('@stencil/unplugin');

module.exports = {
  plugins: [stencilRspack()],
};
```

## Testing with Vitest

### `newSpecPage()` tests

`stencilSpecPage()` is a Vite plugin for your `vitest.config.ts`. It transpiles components so they work with `newSpecPage()` from `@stencil/core/testing`, which lets spec tests written for Stencil v4 run under Vitest without changing their imports.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { stencilSpecPage } from '@stencil/unplugin';

export default defineConfig({
  plugins: [stencilSpecPage()],
  test: {
    include: ['src/**/*.spec.{ts,tsx}'],
  },
});
```

```ts
// src/components/my-button/my-button.spec.ts
import { newSpecPage } from '@stencil/core/testing';
import { expect, it } from 'vitest';

import { MyButton } from './my-button';

it('renders its label', async () => {
  const page = await newSpecPage({
    components: [MyButton],
    html: `<my-button label="Save"></my-button>`,
  });
  expect(page.root!.shadowRoot!.textContent).toBe('Save');

  page.root!.label = 'Cancel';
  await page.waitForChanges();
  expect(page.root!.shadowRoot!.textContent).toBe('Cancel');
});
```

In this mode components don't register themselves as custom elements. `newSpecPage()` registers the ones you pass it, in Stencil's mock DOM.

The plugin also resolves a bare `@stencil/core` import to `@stencil/core/testing` in test files, so something like `setMode` imported from `@stencil/core` affects the same runtime `newSpecPage()` uses.

It takes the same [options](#options) as the other plugins.

### Browser and Node tests

For tests that import a component and use it as a real custom element, use `stencilVite()`. Components are compiled on the fly, so no Stencil build is needed first, and each one registers itself when its file is imported. A test must import every component it renders, including ones rendered by other components.

```ts
// vitest.config.ts
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { stencilVite } from '@stencil/unplugin';

export default defineConfig({
  plugins: [stencilVite()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

The same plugin works for tests that run in Node with a simulated DOM. Replace the `browser` block with an `environment`: `'jsdom'`, `'happy-dom'`, or the `'stencil'` environment from [`@stencil/vitest`](https://github.com/stenciljs/vitest), which uses Stencil's mock-doc by default.

To have `components.d.ts` written while tests run, so the JSX in them type-checks, pass `types: true`.

## Options

All options are optional.

```ts
stencilVite({
  // Glob/regex patterns of files to transform. Default: [/\.tsx?$/]
  include: ['src/**/*.tsx'],

  // Glob patterns to exclude. Default: ['node_modules/**']
  exclude: ['**/*.spec.tsx'],

  // Enable HMR injection. Auto-detected as true in Vite dev mode (command === 'serve').
  // For webpack/rspack, set true explicitly when running webpack-dev-server or @rspack/dev-server.
  dev: true,

  // Opt in to docs scanning — see "Docs / CEM" section below.
  docs: true,

  // Extra options forwarded to transpileSync for every transformed file.
  // The plugin manages: file, resolveImport, styleImportData, componentMetadata, coreImportPath — don't set those here.
  transpileOptions: {
    sourceMap: true,
    // 'customelement' (default) self-registers on import; 'module' only exports the class.
    componentExport: 'customelement',
  },
});
```

| Option | Default | Description |
|---|---|---|
| `include` | `[/\.tsx?$/]` | Files to consider for transformation |
| `exclude` | `['node_modules/**']` | Files to skip |
| `dev` | `false` (auto in Vite) | Inject HMR client code into component output |
| `docs` | `false` | Scan and accumulate component metadata for docs/CEM |
| `types` | `false` | Write `<srcDir>/components.d.ts` at build start and keep it current as components change |
| `transpileOptions` | — | Passed through to `transpileSync` (see `TranspileOptions`) |

## How it works

### Component transform

Only files containing Stencil decorators (`@Component`, `@Prop`, `@State`, etc.) are compiled. Everything else passes through untouched, apart from `Build` flag folding (below).

Matching files are compiled with `componentExport: 'customelement'` by default, which means each component self-registers via `customElements.define` (if not already defined) when the module is imported — no separate registration step needed.

#### Opting out of self-registration

Set `transpileOptions.componentExport: 'module'` to get modules that only export the component class, with no registration side effect on import. Registering is then up to the consumer:

```ts
import { MyButton } from './my-button';

customElements.define('my-button', MyButton);
```

In dev mode, HMR looks instances up by the tag from `@Component({ tag })`, so components registered under a different name aren't hot-updated.

### `Build` flags

In production builds, `Build.isBrowser` / `Build.isServer` checks are replaced with `true` / `false`, so server-only code is tree-shaken out of browser bundles.

### CSS pipeline

Stencil emits style imports with query parameters (e.g. `./my-comp.css?tag=my-comp&encapsulation=shadow`). The plugin intercepts these and runs them through the following pipeline (each step only runs if the peer dep is installed):

1. **Sass / Less** — compile `.scss`, `.sass`, or `.less` to CSS
2. **PostCSS** — process with `postcss.config.*` if found in the project
3. **lightningcss** — syntax lowering, vendor prefixes; minification in production
4. **Scoped rewrite** — scope-prefix selectors for `encapsulation: 'scoped'` components

### HMR

- **Vite**: a `stencil:hmr` WebSocket event is sent when a component file changes. Existing instances in the page are patched in-place without a full reload.
- **Webpack / Rspack**: uses the `module.hot` re-execution pattern — new class prototype methods are patched onto live instances.
- Set `dev: true` explicitly for webpack/rspack dev servers; Vite auto-detects it.

## Docs / Custom Elements Manifest

When `docs: true` is set, the plugin scans all component files at build start and accumulates `JsonDocsComponent` metadata as each file is transformed. The aggregate CEM is exposed as a virtual module:

```ts
// In your app or Storybook preset:
import cem from '@stencil/unplugin/docs';

console.log(cem.modules); // Custom Elements Manifest
```

You can also access the CEM programmatically at any point (e.g. from a Node.js build script):

```ts
import { getStencilCEM, STENCIL_DOCS_ID } from '@stencil/unplugin';

// After the build/transform has run:
const manifest = getStencilCEM();

// STENCIL_DOCS_ID is the virtual module specifier: '@stencil/unplugin/docs'
console.log(STENCIL_DOCS_ID);
```

`getStencilCEM()` returns an empty CEM if `docs: true` was not set on the plugin.
