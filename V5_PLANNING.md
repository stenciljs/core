# Stencil v5 Planning Document

> **Living Document** - Track progress on v5 modernization

## Vision

Modernize Stencil after 10 years: shed tech debt, embrace modern tooling, simplify architecture, streamline user experience.

---

## Major Goals

### 1. 🧪 Remove Integrated Testing
**Status:** 📋 Replacement packages ready - need to remove integrated testing (`src/testing/jest` and `src/testing/puppeteer`)
- `@stencil/vitest` + `@stencil/playwright` audited and ready
- Still need to migrate Stencil's internal tests from jest to vitest
- Still migrating integration / e2e test suites (in `packages/core/tests/`) 

### 2. 🗑️ Update / Remove Legacy Features
**Status:** In Progress
- ES5 builds → ✅ REMOVED
- Internal CommonJS → Pure ESM (Node 18+) ✅ REMOVED
- Ancient polyfills → ✅ REMOVED
- In-browser compilation → REMOVE
- *-sys in-memory file-system (patching node / typescript to do in-memory builds) → use newer 'incremental' build APIs in TypeScript instead. See ./new-ts-non-sys-pattern for some relevant code.
- Hand-crafted dev server / HMR → modernize as `@stencil/dev-server` (Vite doesn't fit lazy-loading architecture)

### 3. 🔧 Build System: tsdown
**Status:** ✅ Complete

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
**Status:** ✅ Complete (dev-server pending)
```
packages/
├── core/        @stencil/core (compiler + runtime)
├── cli/         @stencil/cli
├── mock-doc/    @stencil/mock-doc
└── dev-server/  @stencil/dev-server (planned)
```

### 5. 🔗 CLI/Core Dependency Architecture
**Status:** ✅ Complete

Break the circular dependency between CLI and Core. Make Core standalone, CLI thin.

See [CLI/Core Architecture](#clicore-architecture) section for details.

### 6. Update public build chain
- Migrate from rollup to rolldown
- Potentially move from typescript to tsgo

### 7. Document ALL BREAKING CHANGES

- `@stencil/core/internal` → `@stencil/core/runtime`
- `@stencil/core/internal/client` → `@stencil/core/runtime/client`
- `@stencil/core/internal/hydrate` → `@stencil/core/runtime/server`
- `@stencil/core/cli` → `@stencil/cli`
- `@stencil/core/dev-server` → `@stencil/dev-server`
- `openBrowser` now defaults to `false`. Override with `--open` flag or `openBrowser: true` in config.
- `dist` and `dist-hydrate-script` output targets no longer generate CJS bundles by default. Add `cjs: true` to your output target config to restore CJS output.
- `dist-hydrate-script` no longer generates a `package.json` file. Use `exports` in your library's main `package.json` to expose the hydrate script.
- **ES5 build output removed.** The `buildEs5` config option, `--es5` CLI flag, and all ES5-related output (esm-es5 directory, SystemJS bundles, ES5 polyfills) have been removed. Stencil now targets ES2017+ only. IE11 and Edge 18 and below are no longer supported.

### 8. 🏷️ Release Management: Changesets
**Status:** 📋 Planned

Adopt [Changesets](https://github.com/changesets/changesets) for monorepo release management with lockstep versioning.

**Why Changesets:**
- De facto standard for pnpm monorepos (used by Vite, SvelteKit, Turborepo)
- Supports `fixed` mode for lockstep versioning across all packages
- Auto-generates changelogs
- Works great with GitHub Actions

**Setup:**
```bash
pnpm add -D @changesets/cli
pnpm changeset init
```

**Config (`.changeset/config.json`):**
```json
{
  "fixed": [["@stencil/core", "@stencil/cli", "@stencil/mock-doc", "@stencil/dev-server"]],
  "access": "public",
  "baseBranch": "main"
}
```

---

## Build System: tsdown

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
├── mock-doc/            @stencil/mock-doc
│   ├── src/
│   ├── dist/
│   └── tsdown.config.ts
└── dev-server/          @stencil/dev-server (planned)
    ├── src/
    │   ├── server/      (HTTP + WebSocket server)
    │   ├── client/      (Browser HMR client, injected)
    │   └── templates/   (Error overlay, directory index)
    ├── dist/
    └── tsdown.config.ts
```

**Build system:** tsdown + pnpm workspaces
**Module format:** Pure ESM
**Node floor:** 22 LTS

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
9. **Modernize dev-server, don't replace** - Vite/esbuild assume static module graphs; Stencil's lazy-loading needs DOM-based HMR

---

## Tasks

### ✅ Build System Migration
- [x] Add tsdown to each package
- [x] Create tsdown.config.ts for mock-doc
- [x] Create tsdown.config.ts for core
- [x] Create tsdown.config.ts for cli
- [x] Update root package.json scripts
- [x] Delete Vite configs and build.ts
- [x] Delete turbo.json
- [x] Test build output matches previous

### ✅ CLI/Core Decoupling
- [x] Move `ConfigFlags` type to CLI (already there)
- [x] Move flag→config merge logic from Core to CLI (new `mergeFlags.ts`)
- [x] Remove `flags` from `ValidatedConfig`
- [x] Simplify `setBooleanConfig` (remove flag param)
- [x] Update Core's package.json: add `@stencil/cli` as dependency
- [x] Update CLI's package.json: change to peerDependency on `@stencil/core`
- [x] Create `packages/core/bin/stencil.mjs`
- [x] Move flag-related tests from Core to CLI

**Intentionally removed in v5:**
- `src/screenshot/` - removed
- `src/testing/jest/` - replaced with `@stencil/vitest`
- `src/testing/puppeteer/` - replaced with `@stencil/playwright`

## Migrate *.sys patching for in-memory stuff
- [ ] Remove all `*.sys` patching code
- [ ] Replace with new TypeScript incremental APIs (see ./new-ts-non-sys)

## 🛢️ Eliminate Barrel Exports in `src/utils`
- [ ] Use [barrel-breaker](https://github.com/nicolo-ribaudo/babel-plugin-transform-barrels) or similar tool to eliminate barrel exports
- [ ] The `src/utils/index.ts` barrel causes bundling issues (e.g., `minimatch` leaking into server/runner bundle)
- [ ] All imports should use direct paths (e.g., `from '../../utils/message-utils'` not `from '../../utils'`)

## ✅ Version.ts Modernization
**Status:** Complete

Simplified the version/build identification system for v5:

### Build-time constants (baked into dist via tsdown `define`):
- `version` - Stencil version (e.g., "5.0.0" or "5.0.0-dev.1708618229.abc123")
- `buildId` - Unique build identifier (epoch seconds)
- `vermoji` - Hash-based emoji for dev builds, random-unused for releases

### Runtime tool versions (read via `local-pkg` when needed):
- Tool versions (terser, postcss, autoprefixer, etc.) now read at runtime
- Correctly invalidates cache when user's actual installed tool versions change
- No longer tied to versions baked in when Stencil was built

### Files:
- `packages/core/src/version.ts` - Exports build constants + `getToolVersion()` helper
- `packages/core/build/version-utils.ts` - Build-time utilities for tsdown config
- `packages/core/tsdown.config.ts` - Uses `define` for string replacements

### Removed:
- `__BUILDID:TRANSPILE__` - was never used
- `__BUILDID:BUNDLER__` - was never used
- `__BUILDID:MINIFYJS__` - now runtime via `getToolVersion('terser')`
- `__BUILDID:OPTIMIZECSS__` - now runtime via `getToolVersion('autoprefixer')` + `getToolVersion('postcss')`
- `__VERSION:*` for dependencies - now runtime via `versions` object getters
- jQuery from CLI info display (still used by mock-doc internally)

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

- **ES5 builds** - ✅ Removed (polyfills, dual builds, SystemJS)
- **Ancient polyfills** - ✅ Removed (`polyfills` config option + emission removed from `dist`, `www`, `dist-lazy` output targets)
- **In-browser compilation** - Remove bundled TypeScript (pending)
- **Node floor:** 22 LTS, **Browser floor:** ES2017+

</details>


---

## ⚠️ Notes for Future Agents

**To build v5:**
```bash
pnpm run build
```

**To develop v5 (watch mode):**
```bash
pnpm run dev
```

In individual packages or from root. pnpm workspaces handle dependency ordering automatically.

---

*Last updated: 2026-04-04*
