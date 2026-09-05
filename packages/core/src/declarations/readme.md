# Declarations

## `index.ts`

Index of every declaration within Stencil's source for convenience. Exports both public and private declarations. Meant to only be used by Stencil's source code so `* as d from './declarations` is easy to use.

## `stencil-private`

Declarations like `CompilerCtx` and `BuildCtx` would be in here. Declarations in this file should always be safe to refactor and are never meant to be used by external code.

## `stencil-public-compiler`

Build time declarations for the compiler that can be publicly exposed, but this file itself is never directly imported by user code. Declarations like `Config` and `OutputTarget` would be in here.

## `stencil-public-runtime`

Client-side declarations for the runtime that can be publicly exposed, but this file itself is never directly imported by user code. Declarations like `HTMLStencilElement`, `JSXBase`, and `Component` would be in here.

This is also the file that would be copied to distribution `dist/types` directories. For example, a dist `dist/types/components.d.ts` file would start with `import { HTMLStencilElement, JSXBase } from './stencil.public';`, so the `stencil.public.runtime.d.ts` file should be a sibling. A distribution copy of Stencil Core declarations should not have a dependency of `@stencil/core`.

## `stencil-public-docs`

Declarations for the shape of generated documentation data - `JsonDocs`, the type library, and related types used by the `docs-*` output targets (`docs-json`, `docs-readme`, `docs-custom-elements-manifest`, etc).

## `stencil-ext-modules`

The TypeScript ambient module declaration file so TypeScript can import asset files (`.css`, `.svg`, `.txt`, `.frag`, `.vert`) without throwing errors. As of v5, ambient asset imports require a `?stencil` suffix (e.g. `import styles from './my-styles.css?stencil'`) to avoid clashing with other packages' own `*.css` module declarations in a monorepo - `stencil migrate` appends the suffix to existing imports automatically. Build steps manually copy this file to the correct location.

## `child_process.ts`

Re-exports Node's `Serializable` type under an alias (`CPSerializable`) so it can be bundled into the public declarations without pulling in the whole `child_process` module via `dts-bundle-generator`.

## The actual public entry point

There's no `stencil-core.ts` file - the public declarations exported when `@stencil/core` is imported by developer code are assembled directly in `../index.d.mts` (and `../index.ts` for the runtime side), which re-export the relevant subset of `stencil-public-compiler` and `stencil-public-runtime`.