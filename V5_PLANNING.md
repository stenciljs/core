# Stencil v5 Planning Document

> **Living Document** - Track progress on v5 modernization

## Vision

Modernize Stencil after 10 years: shed tech debt, embrace modern tooling, simplify architecture, streamline user experience.

---

## Major Goals

### 1. 🧪 Remove Integrated Testing
**Status:** 📋 Replacement packages ready - need to remove integrated testing
- `@stencil/vitest` + `@stencil/playwright` audited and ready
- Still need to migrate Stencil's internal tests from jest to vitest
- Still migrating integration / e2e test suites (in `packages/core/tests/`)

### 2. 🗑️ Update / Remove Legacy Features
**Status:** In Progress
- ES5 builds → ✅ REMOVED
- Internal CommonJS → ✅ REMOVED (Pure ESM, Node 18+)
- Ancient polyfills → ✅ REMOVED
- In-browser compilation → REMOVE
- `*-sys` in-memory file-system → Replace with TypeScript incremental APIs (see Tasks)
- Hand-crafted dev server / HMR → modernize as `@stencil/dev-server`

### 3. 🔧 Build System
**Status:** ✅ Complete
- **tsdown** for all package builds (single config per package)
- **pnpm -r** for build orchestration (no Turborepo)

### 4. 📦 Mono-repo Restructure
**Status:** ✅ Complete (dev-server pending)
- `packages/core/` (@stencil/core), `packages/cli/` (@stencil/cli), `packages/mock-doc/` (@stencil/mock-doc)

### 5. 🔗 CLI/Core Dependency Architecture
**Status:** ✅ Complete
- Broke circular dependency between CLI and Core. Core standalone, CLI thin.

### 6. Update Public Build Chain
**Status:** 📋 Planned
- Migrate from rollup to rolldown
- Potentially move from typescript to tsgo

### 7. 📤 Output Target Modernization
**Status:** ✅ Complete
- Renamed output targets for clarity (`dist` → `loader-bundle`, `dist-custom-elements` → `standalone`, etc.)
- Elevated sub-outputs to first-class citizens (`types`, `collection`)
- See Breaking Changes for full details

### 8. 📁 Global Styles & Assets Modernization
**Status:** ✅ Complete
- New `global-style` and `assets` output targets (first-class, auto-generated)
- Unified `dist/assets/` location shared by all outputs
- See Breaking Changes for full details

### 9. 🏷️ Release Management: Changesets
**Status:** 📋 Planned
- Adopt [Changesets](https://github.com/changesets/changesets) for monorepo release management with lockstep versioning

---

## Breaking Changes

- `@stencil/core/internal` → `@stencil/core/runtime`
- `@stencil/core/internal/client` → `@stencil/core/runtime/client`
- `@stencil/core/internal/hydrate` → `@stencil/core/runtime/server`
- `@stencil/core/cli` → `@stencil/cli`
- `@stencil/core/dev-server` → `@stencil/dev-server`
- `openBrowser` now defaults to `false`. Override with `--open` flag or `openBrowser: true` in config.
- **Output target renames:**
  - `dist` → `loader-bundle` (default dir: `dist/loader-bundle/`)
  - `dist-custom-elements` → `standalone` (default dir: `dist/standalone/`)
  - `dist-hydrate-script` → `ssr` (default dir: `dist/ssr/`)
  - `dist-collection` (sub-output) → `collection` (first-class output, default dir: `dist/collection/`, auto-generated in prod)
  - `dist-types` (sub-output) → `types` (first-class output, default dir: `dist/types/`, auto-generated in prod)
  - `collectionDir` and `typesDir` config options removed from `loader-bundle` config
  - Run `stencil migrate` to automatically update your config
- `loader-bundle` and `ssr` output targets no longer generate CJS bundles by default. Add `cjs: true` to your output target config to restore CJS output.
- `ssr` no longer generates a `package.json` file. Use `exports` in your library's main `package.json` to expose the SSR script.
- **ES5 build output removed.** The `buildEs5` config option, `--es5` CLI flag, and all ES5-related output have been removed. Stencil now targets ES2017+ only. IE11 and Edge 18 and below are no longer supported.
- **@Component decorator `shadow`, `scoped`, and `formAssociated` properties removed.** Use the new unified `encapsulation` property instead:
  - `shadow: true` → `encapsulation: { type: 'shadow' }`
  - `shadow: { delegatesFocus: true }` → `encapsulation: { type: 'shadow', delegatesFocus: true }`
  - `scoped: true` → `encapsulation: { type: 'scoped' }`
  - Default (no encapsulation) → `encapsulation: { type: 'none' }` (optional, 'none' is default)
  - **New feature:** `encapsulation: { type: 'shadow', mode: 'closed' }` enables closed shadow DOM
  - **New feature:** Per-component slot patches via `encapsulation: { type: 'scoped', patches: ['children', 'clone', 'insert'] }`
  - `formAssociated: true` → Use `@AttachInternals()` decorator instead (auto-sets `formAssociated: true`)
  - To use `@AttachInternals` without form association: `@AttachInternals({ formAssociated: false })`
  - Run `stencil migrate --dry-run` to preview automatic migration, or `stencil migrate` to apply changes
- **`buildDist` and `buildDocs` config options removed.** Use `skipInDev` on individual output targets for granular control.
- **`--esm` CLI flag removed.** Configure `skipInDev` on output targets instead.
- **`--prod` CLI flag removed.** Production is the default. Use `--dev` to opt into a development build.
- **`devMode` config option removed from `stencil.config.ts`.** Build mode is now exclusively controlled by the `--dev` CLI flag.
- **`isPrimaryPackageOutputTarget` removed from output targets.** Package.json validation now auto-detects based on configured outputs.
- **`validatePrimaryPackageOutputTarget` config option renamed to `validatePackageJson`.**
- **Export maps generation uses smart defaults.** Priority: `loader-bundle` > `standalone` for the root export. Types always come from the `types` output target.
- **`collection` field in package.json renamed to `collection`.**
- **Output file extensions modernized:**
  - ESM files now use `.js` extension (was `.esm.js`)
  - CJS files now use `.cjs` extension (was `.cjs.js`)
  - Backwards compat: forwarding module `<namespace>.esm.js` generated for existing CDN consumers
- **Global styles and assets modernized:**
  - New `global-style` output target (first-class, auto-generated when `globalStyle` config exists)
  - New `assets` output target (first-class, auto-generated when components have `assetsDirs`)
  - Unified location: `dist/assets/` for both global styles and component assets
  - `copyAssets` option removed from `loader-bundle` and `www` output targets
  - `extras.addGlobalStyleToComponents` removed - use `inject` option on `global-style` output target instead:
    - `inject: 'none'` - don't inject, load stylesheet externally
    - `inject: 'client'` - inject into components on client only
    - `inject: 'all'` - inject into components on both client and SSR
  - Auto-generated `global-style` (from `globalStyle` config) defaults to `inject: 'client'` (preserves v4 behavior)
  - Explicitly configured `global-style` outputs default to `inject: 'none'`
- **`esmLoaderPath` config option renamed to `loaderPath`** in `loader-bundle` output target.
- **`hashFileNames` and `hashedFileNameLength` moved from top-level config to `loader-bundle` and `www` output targets.** Only these two targets serve bundles directly in the browser. Run `stencil migrate` to remove them from the top-level config, then add to your output targets if non-default values are needed.

---

## New Features

- **`global-style` output target now supports explicit `input`** - specify CSS source file directly on output target instead of using `globalStyle` config
- **`global-style` output target now supports `fileName`** - customize output filename
- **`global-style` output target now supports `inject`** - control whether styles are injected into component shadow DOMs (`'none'`, `'client'`, `'all'`)
- **Multiple `global-style` outputs supported** - build separate CSS bundles from different input files, each with independent `inject` settings
- **`www` can now use standalone loader**

---

## Tasks

### 🛢️ Eliminate Barrel Exports in `src/utils`
- [ ] Use [barrel-breaker](https://github.com/nicolo-ribaudo/babel-plugin-transform-barrels) or similar tool
- [ ] The `src/utils/index.ts` barrel causes bundling issues (e.g., `minimatch` leaking into server/runner bundle)
- [ ] All imports should use direct paths

### ⚠️ `*.sys` Patching (Assess)
- [ ] 40+ files still use `.sys.` patterns for in-memory file system operations
- [ ] Original plan: replace with TypeScript incremental APIs
- [ ] No reference implementation exists - needs investigation if this is still the right approach
- [ ] May be deferrable if not blocking other goals

---

## 🚀 Watch Mode Fast Path (Planned)

### Problem
Even single-file changes trigger full build pipeline (~500ms-1s).

### Solution
Leverage `transpileModule()` for a "fast path" in watch mode:

1. **Add shared context** to `transpileModule` - reuse existing `Program`/`TypeChecker` from watch build
2. **Change detection** - compare old vs new component metadata:
   - API changed (props/events/methods)? → Full rebuild
   - JSDoc changed + docs targets exist? → Regen docs only
   - Neither? → Hot-swap module only
3. **Non-component fast path** - plain `.ts` files skip Stencil transforms entirely

### Expected Impact
| Change Type | Current | With Fast Path |
|-------------|---------|----------------|
| Internal logic change | ~500ms-1s | **< 50ms** |
| JSDoc change (with docs) | ~500ms-1s | **< 100ms** |
| API change (new prop) | ~500ms-1s | ~500ms-1s (unchanged) |

~80% of dev changes are internal logic → massive improvement for typical workflow.

---

## Architecture Reference

```
packages/
├── core/        @stencil/core (compiler + runtime)
├── cli/         @stencil/cli
├── mock-doc/    @stencil/mock-doc
└── dev-server/  @stencil/dev-server (planned)
```

**Build:** tsdown + pnpm workspaces | **Module format:** Pure ESM | **Node floor:** 22 LTS

### Key Decisions
- Don't bundle TypeScript/terser/parse5 - use as normal dependencies
- Keep Terser over SWC for minification (SWC produces ~18KB vs Terser's ~11.8KB for runtime)

---

## Build Commands

```bash
pnpm run build     # Build all packages
pnpm run dev       # Watch mode
```

---

*Last updated: 2026-04-29*
