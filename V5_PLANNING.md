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
- ✅ Renamed internal → runtime (public API change)
- ⏳ Fix type generation (use tsc + dts-bundle-generator properly)
- ⏳ Remove build-time aliases (@utils, @app-data, etc.) - convert to relative imports

### 4. 📦 Mono-repo Restructure  
**Status:** ✅ Complete
```
packages/
├── core/        @stencil/core (compiler + runtime)
├── cli/         @stencil/cli
└── mock-doc/    @stencil/mock-doc
```

### 5. Document ALL BREAKING CHANGES

- `@stencil/core/internal` → `@stencil/core/runtime`
- `@stencil/core/internal/client` → `@stencil/core/runtime/client`
- `@stencil/core/internal/hydrate` → `@stencil/core/runtime/server`
- REMOVED `@stencil/core/internal/testing`
- REMOVED `@stencil/core/testing`
- `@stencil/core/cli` → `@stencil/cli`

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
│   │   └── runtime/           (runtime bundles)
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

### ⏳ Fix type generation
Currently using fallback/stub instead of proper `tsc` + `dts-bundle-generator`

### ⏳ Remove build-time aliases
Convert `@utils`, `@app-data`, etc. to relative imports

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
- `runtime/index.js` - 53.73 kB (type exports)
- `runtime/client/` - 103.26 kB (browser runtime)
- `runtime/server/` - 185.55 kB (SSR/hydration)
- `runtime/app-data/` - 2.25 kB (build conditionals)
- `runtime/app-globals/` - 0.13 kB (global state)

---

## ⚠️ Notes for Future Agents

**All v5 changes should be made in `packages/` only.**

The root `src/` directory is a v4 reference/dummy and should NOT be modified unless explicitly instructed. The v5 source of truth is:
- `packages/core/src/` - compiler and runtime
- `packages/cli/src/` - CLI
- `packages/mock-doc/src/` - mock-doc

---

*Last updated: 2026-02-09 Session 7*

