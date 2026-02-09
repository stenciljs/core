# Stencil v5 Planning Document

> **Living Document** - Track progress on v5 modernization

## Vision

Modernize Stencil after 10 years: shed tech debt, embrace modern tooling, simplify architecture.

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
- node-sys in-memory file-system → hand over to Vite
- Hand-crafted dev server → replace with Vite dev server

### 3. 🔧 Build System: tsdown
**Status:** 🚧 In Progress (Replacing Vite + Turborepo)

Previous approach used Vite + Turborepo with 8 separate config files for core alone. New approach:

- **tsdown** for all package builds (single config per package, multiple entries)
- **pnpm -r** for build orchestration (no Turborepo)
- Simple, easy to understand, not mental

```bash
# Root package.json
"build": "pnpm -r build"
"dev": "pnpm -r build --watch"
```

See [Build System](#build-system-tsdown-1) section for details.

### 4. 📦 Mono-repo Restructure
**Status:** ✅ Complete
```
packages/
├── core/        @stencil/core (compiler + runtime)
├── cli/         @stencil/cli
└── mock-doc/    @stencil/mock-doc
```

### 5. 🔗 CLI/Core Dependency Architecture
**Status:** 🚧 In Progress

Break the circular dependency between CLI and Core. Make Core standalone, CLI thin.

See [CLI/Core Architecture](#clicore-architecture) section for details.

### 6. Translate current, public API (stencil.config) to wrap Vite
- Move core output targets' direct rollup calls to instead be Vite calls

### 7. Document ALL BREAKING CHANGES

- `@stencil/core/internal` → `@stencil/core/runtime`
- `@stencil/core/internal/client` → `@stencil/core/runtime/client`
- `@stencil/core/internal/hydrate` → `@stencil/core/runtime/server`
- `@stencil/core/cli` → `@stencil/cli`

---

## Build System: tsdown

### Why tsdown?

| Problem with Vite | Solution with tsdown |
|-------------------|---------------------|
| 8 separate config files for core | Single config with multiple entries |
| Custom build.ts orchestrator | Native multi-entry support |
| Turborepo for package ordering | Simple `pnpm -r build` |
| vite-plugin-dts for types | Built-in dts generation |
| Complex, hard to understand | Simple, explicit |

### Configuration

Each package gets one `tsdown.config.ts`:

```typescript
// packages/core/tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig([
  // Node targets (compiler, server, testing)
  {
    entry: {
      'index': 'src/compiler/index.ts',
      'compiler/utils/index': 'src/compiler/utils/index.ts',
      'runtime/server/index': 'src/server/index.ts',
      'testing/index': 'src/testing/index.ts',
    },
    outDir: 'dist',
    platform: 'node',
    target: 'node18',
    dts: true,
    external: ['typescript', 'terser', 'parse5', '@stencil/mock-doc'],
  },
  // Browser targets (runtime, client, app-data, app-globals)
  {
    entry: {
      'runtime/index': 'src/runtime/index.ts',
      'runtime/client/index': 'src/client/index.ts',
      'runtime/app-data/index': 'src/app-data/index.ts',
      'runtime/app-globals/index': 'src/app-globals/index.ts',
    },
    outDir: 'dist',
    platform: 'browser',
    target: ['es2022', 'chrome79', 'firefox70', 'safari14'],
    dts: true,
  },
])
```

```typescript
// packages/cli/tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  platform: 'node',
  target: 'node18',
  dts: true,
  shims: true,
})
```

### What Gets Deleted

- `packages/core/vite.*.config.ts` (8 files)
- `packages/core/build.ts`
- `packages/core/vite-plugin-virtual-modules.ts`
- `packages/cli/vite.config.ts`
- `packages/mock-doc/vite.config.ts`
- `turbo.json`
- vite, vite-plugin-dts dependencies

### What Gets Added

- `tsdown` as devDependency in each package
- One `tsdown.config.ts` per package

---

## CLI/Core Architecture

### Problem: Circular Dependency

Current state creates a circular dependency:
```
cli → core (needs compiler APIs, types)
core → cli (needs ConfigFlags type, createConfigFlags)
```

### Solution: Smart CLI, Pure Core

**Core** is standalone - no awareness of CLI concepts:
- Receives config objects, not "flags"
- Validates and normalizes config values
- No `flags` property on `ValidatedConfig`

**CLI** is the user interface layer:
- Parses argv → `ConfigFlags` (owns this type entirely)
- Loads `stencil.config.ts`
- **Merges flags into config** (CLI owns this logic):
  - `--dev` → `config.devMode = true`
  - `--prod` → `config.devMode = false`
  - `--verbose` → `config.logLevel = 'debug'`
  - `--watch` → `config.watch = true`
- Passes clean config object to Core

### Package Dependencies (Nuxt Pattern)

```
@stencil/core
├── dependencies: { "@stencil/cli": "..." }
└── bin/stencil.js → import '@stencil/cli'

@stencil/cli
├── peerDependencies: { "@stencil/core": "..." }
└── devDependencies: { "@stencil/core": "workspace:*" }
```

**Why this works:**
1. User installs `@stencil/core`
2. npm/pnpm installs `@stencil/cli` as a dependency of core
3. CLI's peer dependency on `@stencil/core` is satisfied by the parent
4. No circular resolution - CLI doesn't *pull in* core, it just *expects* it

### Code Changes Required

| What | From | To |
|------|------|-----|
| `ConfigFlags` type | CLI | CLI (stays) |
| `createConfigFlags` | CLI | CLI (stays) |
| Flag→config merge logic | Core (`validate-config.ts`) | CLI (new) |
| `ValidatedConfig.flags` | Core | Remove |
| Config validation | Core | Core (stays, simplified) |
| `setBooleanConfig` with flag lookups | Core | Simplify (no flag param) |

### Tests Follow Code

- Flag parsing tests → CLI
- Config validation tests → Core

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
│   │   ├── testing/    (Testing utilities)
│   │   └── utils/      (Shared utilities)
│   ├── bin/
│   │   └── stencil.js  (imports @stencil/cli)
│   ├── dist/
│   │   ├── index.js           (compiler)
│   │   └── runtime/           (runtime bundles)
│   │       ├── index.js
│   │       ├── client/
│   │       ├── server/
│   │       ├── app-data/
│   │       └── app-globals/
│   └── tsdown.config.ts
├── cli/                 @stencil/cli
│   ├── src/
│   ├── dist/
│   └── tsdown.config.ts
└── mock-doc/            @stencil/mock-doc
    ├── src/
    ├── dist/
    └── tsdown.config.ts
```

**Build system:** tsdown + pnpm workspaces
**Module format:** Pure ESM
**Node floor:** 18 LTS

---

## Key Decisions Made

1. **Don't bundle TypeScript/terser/parse5** - Use as normal dependencies
2. **Runtime bundles are build artifacts** - Not separate packages
3. **Pure ESM everywhere** - No CJS internally
4. **hydrate → server** - Clearer naming for SSR/hydration
5. **Remove sys/node abstraction** - Use Node APIs directly (v5 target)
6. **tsdown over Vite** - Better for libraries, single config, no orchestrator needed
7. **No Turborepo** - Simple `pnpm -r build` is sufficient
8. **CLI as peer dep of Core** - Nuxt pattern, avoids circular deps

---

## Immediate Tasks

### 🚧 Build System Migration
- [ ] Add tsdown to each package
- [ ] Create tsdown.config.ts for mock-doc
- [ ] Create tsdown.config.ts for core
- [ ] Create tsdown.config.ts for cli
- [ ] Update root package.json scripts
- [ ] Delete Vite configs and build.ts
- [ ] Delete turbo.json
- [ ] Test build output matches previous

### 🚧 CLI/Core Decoupling
- [ ] Move `ConfigFlags` type to CLI (already there)
- [ ] Move flag→config merge logic from Core to CLI
- [ ] Remove `flags` from `ValidatedConfig`
- [ ] Simplify `setBooleanConfig` (remove flag param)
- [ ] Update Core's package.json: add `@stencil/cli` as dependency
- [ ] Update CLI's package.json: change to peerDependency on `@stencil/core`
- [ ] Create `packages/core/bin/stencil.js`
- [ ] Move flag-related tests from Core to CLI

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
<summary><b>Virtual Modules (May Need Rolldown Plugin)</b></summary>

Current Vite setup uses virtual modules for internal aliasing:
- `virtual:app-data` → `src/app-data/index.ts`
- `virtual:app-globals` → `src/app-globals/index.ts`
- `virtual:platform` → `src/client/index.ts`

With tsdown/Rolldown, we may need:
1. A Rolldown plugin for virtual modules, OR
2. Restructure to use regular imports with path aliases

</details>

---

## ⚠️ Notes for Future Agents

**All v5 changes should be made in `packages/` only.**

The root `src/` directory is a v4 reference/dummy and should NOT be modified unless explicitly instructed. The v5 source of truth is:
- `packages/core/src/` - compiler and runtime
- `packages/cli/src/` - CLI
- `packages/mock-doc/src/` - mock-doc

**To build v5:**
```bash
pnpm run build
```

**To develop v5 (watch mode):**
```bash
pnpm run dev
```

pnpm workspaces handle dependency ordering automatically.

---

*Last updated: 2026-02-09 Session 10*
