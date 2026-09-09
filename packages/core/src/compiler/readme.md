# compiler

The Stencil compiler - transforms TypeScript components into optimized web components.

## Overview

This is the build-time compiler that:

1. Analyzes Stencil components using TypeScript
2. Transforms decorators (`@Component`, `@Prop`, etc.) into runtime metadata
3. Bundles and optimizes output for various targets
4. Generates type definitions and documentation

## Directory Structure

| Directory         | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `transformers/`   | TypeScript AST transformers for decorators, JSX, etc. |
| `bundle/`         | Rollup-compatible plugin integration (typescript, resolve, worker, dev-server, etc.), consumed by rolldown |
| `app-core/`       | Bundles a project's component graph via rolldown (`generateRolldownOutput`) - used by `output-targets/dist-lazy`, `standalone`, `ssr`, `collection` |
| `output-targets/` | Generators for `loader-bundle`, `standalone`, `ssr`, `www`, `collection`, `types`, `global-style`, `assets`, etc. - see `output-targets/readme.md` |
| `config/`         | Config validation and normalization                   |
| `style/`          | CSS/Sass compilation and scoping                      |
| `types/`          | `.d.ts` generation for components                     |
| `html/`           | HTML parsing and manipulation                         |
| `optimize/`       | Minification and tree-shaking                         |
| `prerender/`      | Static site generation / prerendering                 |
| `transpile/`      | Single-file transpilation API (used by `@stencil/unplugin`) |
| `docs/`           | Documentation generators (JSON, Markdown, CEM, agent skill, etc.) |
| `build/`          | `BuildCtx`/`CompilerCtx`, build orchestration and results |
| `entries/`        | Component graph analysis - resolves bundling entry points and dependencies |
| `plugin/`         | Public compiler plugin interface                       |
| `fs-watch/`       | File watcher → rebuild triggering                       |
| `service-worker/` | Service worker generation for `www`/`loader-bundle`     |
| `sys/`            | Compiler-internal system abstraction (in-memory FS for testing, module resolution, fetch) - distinct from the top-level `src/sys/` (Node.js system used at runtime) |
| `worker/`         | Main-thread/worker-thread dispatch for the multi-threaded compiler |

## Key Concepts

### Build Conditionals

The compiler analyzes components to determine which runtime features are needed:

- Uses Shadow DOM? → `BUILD.shadowDom = true`
- Has slots? → `BUILD.slot = true`
- etc.

Unused features are eliminated via dead-code elimination.

### Output Targets

Multiple output formats from a single source - `loader-bundle` (lazy-loaded, the default), `standalone` (single-file custom elements), `www` (full web app with dev server), `ssr` (SSR/hydration bundle), and more. See `output-targets/readme.md` for the full list and directory layout.

## Entry Points

- `index.ts` - Main compiler export
- `public.ts` - Public API subset for external tools