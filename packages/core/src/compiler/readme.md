# compiler

The Stencil compiler - transforms TypeScript components into optimized web components.

## Overview

This is the build-time compiler that:
1. Analyzes Stencil components using TypeScript
2. Transforms decorators (`@Component`, `@Prop`, etc.) into runtime metadata
3. Bundles and optimizes output for various targets
4. Generates type definitions and documentation

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `transformers/` | TypeScript AST transformers for decorators, JSX, etc. |
| `bundle/` | Rollup plugin integration and bundling logic |
| `output-targets/` | Generators for `dist`, `www`, `custom-elements`, etc. |
| `config/` | Config validation and normalization |
| `style/` | CSS/Sass compilation and scoping |
| `types/` | `.d.ts` generation for components |
| `html/` | HTML parsing and manipulation |
| `optimize/` | Minification and tree-shaking |
| `prerender/` | Static site generation / prerendering |
| `transpile/` | Single-file transpilation API |
| `docs/` | Documentation generators (JSON, Markdown, etc.) |

## Key Concepts

### Build Conditionals

The compiler analyzes components to determine which runtime features are needed:
- Uses Shadow DOM? → `BUILD.shadowDom = true`
- Has slots? → `BUILD.slot = true`
- etc.

Unused features are eliminated via dead-code elimination.

### Output Targets

Multiple output formats from a single source:
- `dist` - Lazy-loaded components for libraries
- `dist-custom-elements` - Single-file custom elements
- `www` - Full web app with dev server
- `dist-hydrate-script` - SSR/hydration bundle

## Entry Points

- `index.ts` - Main compiler export
- `public.ts` - Public API subset for external tools
