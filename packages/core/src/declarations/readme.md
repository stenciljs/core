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


## `stencil-core`

The actual public declarations when `@stencil/core` is imported by developer code. This should be a minimal list that exports with specific declarations from `stencil.public.compiler` and `stencil.public.runtime`.


## `stencil-ext-modules`

The TypeScript declaration file used so that TypeScript can import `.svg` or `.css` files without throwing errors. Build steps will manually copy this to the correct location.