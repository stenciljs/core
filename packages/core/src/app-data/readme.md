# app-data

Build-time virtual module that provides compile-time constants to Stencil's runtime.

## How It Works

This directory contains **default values** that get replaced at build time by `src/compiler/bundle/app-data-plugin.ts`. When a Stencil project is compiled, the plugin generates project-specific values based on component metadata.

## Exports

### `BUILD`

A `BuildConditionals` object used for dead-code elimination. The compiler analyzes your components and sets flags like `BUILD.shadowDom`, `BUILD.slot`, etc. based on what features are actually used.

```ts
import { BUILD } from '@app-data';

if (BUILD.shadowDom) {
  // This code is eliminated if no components use Shadow DOM
}
```

### `Env`

User-defined environment variables from `stencil.config.ts`:

```ts
// stencil.config.ts
export const config = {
  env: { apiUrl: 'https://api.example.com' }
};

// component
import { Env } from '@app-data';
console.log(Env.apiUrl);
```

### `NAMESPACE`

The project's namespace from config (defaults to `'app'`).

## Why Defaults Exist

The defaults in `index.ts` serve as:
1. **TypeScript scaffolding** - enables type checking and IDE support
2. **Fallback values** - used when the plugin doesn't replace them
3. **Module resolution** - gives bundlers a real file to resolve
