# app-globals

Build-time virtual module that provides global scripts and styles to the runtime.

## How It Works

This directory contains **stub exports** that get replaced at build time by `src/compiler/bundle/app-data-plugin.ts`. The plugin generates the actual content based on your `stencil.config.ts` settings.

## Exports

### `globalScripts`

A function that executes your project's global initialization script:

```ts
// stencil.config.ts
export const config = {
  globalScript: 'src/global.ts'
};

// src/global.ts
export default function() {
  console.log('App initialized!');
}
```

At build time, this becomes an import and invocation of your `globalScript` file. If multiple collections are used, all their global scripts are combined.

### `globalStyles`

A string containing compiled global CSS:

```ts
// stencil.config.ts
export const config = {
  globalStyle: 'src/global.css'
};
```

At build time, the CSS is compiled and inlined as a string constant.

## Runtime Usage

The `globalScripts()` function is called during app initialization:
- In the browser: during lazy-load bootstrap
- During SSR: in `server/platform/hydrate-app.ts`

## Why Stubs Exist

The empty stubs in `index.ts` serve as:
1. **TypeScript scaffolding** - enables type checking and IDE support
2. **Fallback values** - used when no `globalScript`/`globalStyle` is configured
3. **Module resolution** - gives bundlers a real file to resolve before replacement
