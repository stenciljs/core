# Stencil v5 Planning Document

> **Living Document** - Track progress on v5 modernization

## Vision

Modernize Stencil after 10 years: shed tech debt, embrace modern tooling (Vite), simplify architecture.

---

## Major Goals

### 1. 🧪 Remove Integrated Testing
**Status:** 📋 Replacement packages ready - need to remove `src/testing/`
- `@stencil/vitest` + `@stencil/playwright` audited and ready
- Still need to migrate Stencil's internal tests

### 2. 🗑️ Remove Legacy Features
**Status:** ✅ Decided
- ES5 builds → REMOVE
- Internal CommonJS → Pure ESM (Node 18+)
- Ancient polyfills → REMOVE
- In-browser compilation → REMOVE

### 3. ⚡ Move to Vite
**Status:** 🚧 In Progress
- ✅ Built prototype
- ✅ All packages build with Vite
- ✅ Fixed CLI/Core dependencies (CLI uses @stencil/core/compiler/utils)
- ⏳ Rename internal → runtime (bulk find/replace across codebase)
- ⏳ Fix type generation (use tsc + dts-bundle-generator properly)
- ⏳ Remove build-time aliases (@utils, @app-data, etc.) - convert to relative imports
- ⏳ Type generation

### 4. 📦 Mono-repo Restructure  
**Status:** ✅ Complete
```
packages/
├── core/        @stencil/core (compiler + runtime)
├── cli/         @stencil/cli
└── mock-doc/    @stencil/mock-doc
```

---

## Current v5 Architecture

**Mono-repo structure (pnpm workspaces):**
```
packages/
├── core/                @stencil/core
│   ├── src/
│   │   ├── compiler/   (TypeScript transformers, bundling)
│   │   ├── runtime/    (Reactivity, vDOM, lifecycle)
│   │   ├── client/     (Browser runtime)
│   │   ├── server/     (SSR/hydration - renamed from hydrate)
│   │   └── utils/      (Shared utilities)
│   ├── dist/
│   │   ├── index.js           (compiler)
│   │   └── runtime/           (runtime bundles - to be renamed)
│   │       ├── index.js
│   │       ├── client/
│   │       ├── server/
│   │       ├── app-data/
│   │       └── app-globals/
│   └── vite.*.config.ts (7 configs for different outputs)
├── cli/                 @stencil/cli
│   ├── src/
│   └── dist/
└── mock-doc/            @stencil/mock-doc
    ├── src/
    └── dist/
```

**Build system:** Vite 7.3.1 (replaced `scripts/esbuild/*`)  
**Module format:** Pure ESM  
**Node floor:** 18 LTS

---

## Key Decisions Made

1. **Don't bundle TypeScript/terser/parse5** - Use as normal dependencies
2. **Runtime bundles are build artifacts** - Not separate packages
3. **Pure ESM everywhere** - No CJS internally
4. **hydrate → server** - Clearer naming for SSR/hydration
5. **Remove sys/node abstraction** - Use Node APIs directly (v5 target)

---

## Immediate Tasks

### ⏳ Rename internal → runtime
Current structure uses confusing "internal" naming. Need to rename:

**Directories:**
- `packages/core/src/internal/` → `packages/core/src/runtime/`
- `packages/core/dist/internal/` → `packages/core/dist/runtime/`

**Package exports (package.json):**
- `@stencil/core/internal` → `@stencil/core/runtime`
- `@stencil/core/internal/client` → `@stencil/core/runtime/client`
- `@stencil/core/internal/server` → `@stencil/core/runtime/server`
- etc.

**Code changes (find/replace in all files):**
- Import statements: `from '@stencil/core/internal'` → `from '@stencil/core/runtime'`
- Build aliases: `@internal` → `@runtime` (in vite configs)
- Path references in build scripts and configs

**Files to update:**
- All `.ts`, `.tsx` files (imports)
- All `vite.*.config.ts` (aliases, output paths)
- `build-vite.ts` (output path handling)
- `packages/core/package.json` (exports map)
- Documentation/comments mentioning "internal"

### ⏳ Fix CLI/Core shared dependencies
CLI currently uses build-time aliases to hack into core's source:
```typescript
// packages/cli/vite.config.ts - CURRENT (WRONG)
alias: {
  '@utils': resolve(__dirname, '../core/src/utils'),
}
```

**Problem:** CLI imports ~20 utils from core (buildError, isString, normalizePath, result, etc.)

**Solution:** Export properly from core:
```typescript
// packages/core/package.json
"exports": {
  "./compiler/utils": "./dist/compiler/utils/index.js"
}
```

### ⏳ Fix type generation
Currently using fallback/stub instead of proper `tsc` + `dts-bundle-generator`

---

## Details & Historical Context

<details>
<summary><b>Testing Replacement Details</b></summary>

### Replacement Packages

| Package | Replaces | Purpose |
|---------|----------|---------|
| `@stencil/vitest` | `newSpecPage()` + Jest | Unit/spec testing |
| `@stencil/playwright` | `newE2EPage()` + Puppeteer | E2E testing |

**Migration:** `newSpecPage()` → `render()`, `newE2EPage()` → Playwright API

</details>

<details>
<summary><b>Legacy Features to Remove</b></summary>

- **ES5 builds** - Remove polyfills, dual builds
- **Ancient polyfills** - SystemJS, Promise, fetch
- **In-browser compilation** - Remove bundled TypeScript
- **Node floor:** 18 LTS, **Browser floor:** ES2020

</details>

<details>
<summary><b>Vite Plugin Architecture</b></summary>

**Two modes:**
1. **Dev:** Per-file transform (simple)
2. **Build:** Whole-project analysis → build conditionals → optimized output

**Key insight:** Transformers work in Vite's transform hook. Prototype proved feasibility.

</details>

---

## Current Build Stats

```
mock-doc:  337.62 kB (53 modules)
core:      883.77 kB (336 modules) + runtime bundles
cli:        56.05 kB (100 modules)
Total:     ~4.3s
```

Runtime bundles:
- `internal/index.js` - 97.95 kB (type exports)
- `internal/client/` - 103.27 kB (browser runtime)
- `internal/server/` - 185.55 kB (SSR/hydration)
- `internal/app-data/` - 2.25 kB (build conditionals)
- `internal/app-globals/` - 0.13 kB (global state)

---

*Last updated: 2026-02-08 Session 6*

