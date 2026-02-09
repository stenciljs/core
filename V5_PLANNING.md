# Stencil v5 Planning Document

> **Living Document** - Track progress on v5 modernization

## Vision

Modernize Stencil after 10 years: shed tech debt, embrace modern tooling (Vite), simplify architecture.

---

## Major Goals

### 1. 🧪 Remove Integrated Testing
**Status:** 📋 Replacement packages ready - need to remove `src/testing/jest` and `src/testing/puppeteer`
- `@stencil/vitest` + `@stencil/playwright` audited and ready
- Still need to migrate Stencil's internal tests from jest to vitest
- Still need to find a way to translate Stencil's jest tests / on-the-fly component in-line transpilation to vitest

### 2. 🗑️ Update / Remove Legacy Features
**Status:** ✅ Decided
- ES5 builds → REMOVE
- Internal CommonJS → Pure ESM (Node 18+)
- Ancient polyfills → REMOVE
- In-browser compilation → REMOVE
- node-sys in-memory file-system. We can hand this over to Vite (ts > )
- Hand-crafted dev server (used for development AND www / SSG) → replace with vite dev server

### 3. ⚡ Move Stencil build to Vite
**Status:** 🚧 In Progress
- ✅ Built prototype
- ✅ All packages build with Vite
- ✅ Fixed CLI/Core dependencies (CLI uses @stencil/core/compiler/utils)
- ✅ Renamed internal → runtime (public API change)
- ✅ Removed build-time aliases - converted to relative imports + virtual modules
- ✅ Type generation (core done, cli done, mock-doc done)
- 🚧 Move development server calls / orchestration to point to vite dev server
- 🚧 Move jest tests to vitest (see #1)
- ✅ Get orchestrator working in `--watch` mode 

### 4. 📦 Mono-repo Restructure  
**Status:** ✅ Complete
```
packages/
├── core/        @stencil/core (compiler + runtime)
├── cli/         @stencil/cli
└── mock-doc/    @stencil/mock-doc
```

### 5. Translate current, public API (stencil.config) to wrap vite
- Move core output targets' direct rollup calls to instead be vite calls 

### 6. Document ALL BREAKING CHANGES

- `@stencil/core/internal` → `@stencil/core/runtime`
- `@stencil/core/internal/client` → `@stencil/core/runtime/client`
- `@stencil/core/internal/hydrate` → `@stencil/core/runtime/server`
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
│   │   └── testing/    (Testing things)
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

**Build system:** Vite 7.3.1 + Turborepo (replaced `scripts/esbuild/*`)
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

### ✅ Type generation
- ✅ `core`: vite-plugin-dts integrated with Vite configs
- ✅ `cli`: vite-plugin-dts integrated
- ✅ `mock-doc`: vite-plugin-dts integrated

### ✅ Remove build-time aliases (DONE)
Converted aliases to:
- **Relative imports:** `@utils`, `@runtime`, `@sys-api-node`, `@hydrate-factory`
- **Virtual modules:** `virtual:app-data`, `virtual:app-globals`, `virtual:platform`
  - Follows Vite's virtual module convention with `\0` prefix
  - See `vite-plugin-virtual-modules.ts` for implementation

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
core:      1,221.96 kB (383 modules) + runtime bundles
cli:        48.79 kB (22 modules)
Total:     ~8.5s
```

Runtime bundles:
- `runtime/index.js` - 53.73 kB (type exports)
- `runtime/client/` - 103.26 kB (browser runtime)
- `runtime/server/` - 185.64 kB (SSR/hydration)
- `runtime/app-data/` - 2.25 kB (build conditionals)
- `runtime/app-globals/` - 0.13 kB (global state)

---

## ⚠️ Notes for Future Agents

**All v5 changes should be made in `packages/` only.**

The root `src/` directory is a v4 reference/dummy and should NOT be modified unless explicitly instructed. The v5 source of truth is:
- `packages/core/src/` - compiler and runtime
- `packages/cli/src/` - CLI
- `packages/mock-doc/src/` - mock-doc

**To build v5:**
```bash
pnpm run build:v5
```

**To develop v5 (watch mode):**
```bash
pnpm run dev:v5
```

Turborepo handles:
- Parallel builds across packages
- Dependency ordering (mock-doc → core → cli)
- Build caching (faster CI)

Watch mode skips DTS generation after initial build for faster iteration.

Do NOT use `pnpm build` at root - that builds the legacy v4 code.

**To test v5 bundle output**
```bash
node test-packages.mjs
```

---

*Last updated: 2026-02-09 Session 9*

