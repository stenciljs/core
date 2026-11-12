# @stencil/unplugin

An [unplugin](https://github.com/unjs/unplugin)-based bundler plugin so Stencil components can be authored and consumed directly inside Vite/Rollup/webpack/rspack/esbuild/bun projects, without running the full Stencil compiler/build pipeline.

## How It Works

`plugin.ts` wires together four concerns and exports one factory (`unpluginStencil`) that `index.ts` instantiates per bundler (`stencilVite`, `stencilRollup`, `stencilWebpack`, `stencilEsbuild`):

| File               | Responsibility                                                                 |
| ------------------- | ------------------------------------------------------------------------------- |
| `transform.ts`      | Runs `transpileSync` (from `@stencil/core/compiler`) on `.tsx`/`.ts` files with Stencil decorators, producing self-registering `customelement` output |
| `css.ts`            | Intercepts `?tag=...&encapsulation=...` style imports emitted by the compiler, runs them through Sass/Less → PostCSS → lightningcss → scoped-selector rewrite |
| `config.ts`         | Auto-detects and loads `stencil.config.ts` (via `jiti`), extracts the subset of flags relevant at transpile time |
| `docs.ts`           | Virtual module (`@stencil/unplugin/docs`) exposing the generated Custom Elements Manifest |
| `resolve-types.ts`  | Resolves imported type references for CEM docs (works around `transpileSync`'s single-file TS host) |
| `options.ts`        | `StencilPluginOptions` - the subset of `StencilConfig`/`ConfigCompat` meaningful at transpile time |

## Key Idea

No `stencil build` step - `transpileSync`/`transpileAsync` compiles one file at a time as the host bundler requests it, same as any other bundler transform. Stencil-specific concerns (CSS pipeline, decorator transform, docs) are layered on as unplugin hooks rather than a separate compiler invocation.
