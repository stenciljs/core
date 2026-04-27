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

### 7. 📤 Output Target Modernization
**Status:** 🚧 In Progress

Rename output targets for clarity and elevate sub-outputs to first-class citizens.

**Goals:**
- Intuitive names for newcomers (no more `dist-custom-elements`)
- Parity between distribution strategies (no "primary" vs "afterthought")
- Modular architecture (collection and types as standalone outputs)
- Unified directory structure under `dist/`

See [Output Target Modernization](#output-target-modernization) section for details.

### 8. Document ALL BREAKING CHANGES

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
  - `dist-collection` (sub-output) → `stencil-rebundle` (first-class output, default dir: `dist/stencil-rebundle/`, auto-generated in prod)
  - `dist-types` (sub-output) → `types` (first-class output, default dir: `dist/types/`, auto-generated in prod)
  - `collectionDir` and `typesDir` config options removed from `loader-bundle` config
  - Run `stencil migrate` to automatically update your config
- `loader-bundle` and `ssr` output targets no longer generate CJS bundles by default. Add `cjs: true` to your output target config to restore CJS output.
- `ssr` no longer generates a `package.json` file. Use `exports` in your library's main `package.json` to expose the SSR script.
- **ES5 build output removed.** The `buildEs5` config option, `--es5` CLI flag, and all ES5-related output (esm-es5 directory, SystemJS bundles, ES5 polyfills) have been removed. Stencil now targets ES2017+ only. IE11 and Edge 18 and below are no longer supported.
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
- **`buildDist` and `buildDocs` config options removed.** Use `skipInDev` on individual output targets for granular control:
  - `dist`: `skipInDev: false` (default) - always builds in both dev and prod
  - `dist-custom-elements`: `skipInDev: true` (default) - skips in dev mode, builds in prod
  - `dist-hydrate-script`: `skipInDev: true` (default, unless `devServer.ssr` is enabled)
  - `docs-*` targets: `skipInDev: true` (default) - skips in dev mode, builds in prod
  - `custom` output targets: `skipInDev: true` (default) - skips in dev mode, builds in prod
  - All outputs ALWAYS run in production mode regardless of `skipInDev` setting
  - Run `stencil migrate` to update your config (removes deprecated options)
- **`--esm` CLI flag removed.** Configure `skipInDev` on output targets instead.
- **`--prod` CLI flag removed.** Production is the default. Use `--dev` to opt into a development build.
- **`devMode` config option removed from `stencil.config.ts`.** Build mode is now exclusively controlled by the `--dev` CLI flag. Remove `devMode: true/false` from your config. Run `stencil migrate` to auto-remove it.
- **`isPrimaryPackageOutputTarget` removed from output targets.** Package.json validation now auto-detects based on configured outputs. Remove this property from your output target configs.
- **`validatePrimaryPackageOutputTarget` config option renamed to `validatePackageJson`.** The validation logic now automatically determines recommended values based on which output targets are configured, rather than requiring manual designation of a "primary" output.
- **Export maps generation uses smart defaults.** When generating export maps, Stencil now checks if existing exports are valid before overwriting. Priority: `loader-bundle` > `standalone` for the root export. Types always come from the `types` output target.
- **`collection` field in package.json renamed to `stencilRebundle`.** Update your package.json to use the new field name pointing to the collection manifest.
- **Output file extensions modernized to use standard ES module conventions:**
  - ESM files now use `.js` extension (was `.esm.js`)
  - CJS files now use `.cjs` extension (was `.cjs.js`)
  - Examples: `myapp.js` (was `myapp.esm.js`), `loader.cjs` (was `loader.cjs.js`), `index.cjs` (was `index.cjs.js`)
  - **Backwards compatibility:** For the browser/CDN build (`dist/loader-bundle/<namespace>/`), a forwarding module `<namespace>.esm.js` is generated that re-exports from `<namespace>.js`. This allows existing CDN consumers with hardcoded `.esm.js` references to continue working.
  - **`"type": "module"` is now always recommended** in package.json when generating distributable outputs. The `.cjs` extension is an explicit override that Node.js always treats as CommonJS regardless of the `type` field.
  - This aligns Stencil output with modern Node.js and bundler expectations.
- **`esmLoaderPath` config option removed from `loader-bundle` output target.** The separate `dist/loader/` directory is no longer generated. Instead, package.json exports map `./loader` directly to `loader-bundle/esm/loader.js` (and `loader-bundle/cjs/loader.cjs` for CJS). Types are generated in `types/loader.d.ts`. Remove `esmLoaderPath` from your config.
- **Global styles and assets modernized:**
  - New `global-style` output target (first-class, auto-generated when `globalStyle` config exists)
  - New `assets` output target (first-class, auto-generated when components have `assetsDirs`)
  - Unified location: `dist/assets/` for both global styles and component assets
  - `copyAssets` option removed from `loader-bundle` and `www` output targets
  - Global styles: `copyToLoaderBrowser: true` default copies CSS to loader-bundle dir for backwards compat
  - Assets: No backwards compat copy needed - `getAssetPath()` runtime resolution handles path changes

### 9. 📁 Global Styles & Assets Modernization
**Status:** 📋 Planned

Elevate global styles and assets to first-class unified outputs, available to all distribution strategies.

**Problems with v4:**
- Global styles only output as standalone CSS file for `loader-bundle` and `www`
- `standalone` only gets global styles embedded in components (no separate CSS file)
- Assets only auto-copied for `loader-bundle` and `www`
- `standalone` requires manual `copy` config for assets
- No unified location - assets scattered across output directories

**Goals:**
- New `global-style` output target (first-class, like `types`)
- New `assets` output target for component `assetsDirs`
- Unified `dist/assets/` location shared by all outputs
- Backwards compat via `copyToLoaderBrowser` flag
- Symlinks for www in dev mode (performance)

See [Global Styles & Assets Modernization](#global-styles--assets-modernization) section for details.

### 10. 🏷️ Release Management: Changesets
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
10. **Keep Terser over SWC for minification** - SWC cannot fully constant-fold `BUILD.*` object properties; produces ~18 KB vs Terser's ~11.8 KB for the runtime bundle. Revisit when SWC matures. (Investigated April 2026)

---

## Tasks

## Migrate *.sys patching for in-memory stuff
- [ ] Remove all `*.sys` patching code
- [ ] Replace with new TypeScript incremental APIs (see ./new-ts-non-sys)

## 🛢️ Eliminate Barrel Exports in `src/utils`
- [ ] Use [barrel-breaker](https://github.com/nicolo-ribaudo/babel-plugin-transform-barrels) or similar tool to eliminate barrel exports
- [ ] The `src/utils/index.ts` barrel causes bundling issues (e.g., `minimatch` leaking into server/runner bundle)
- [ ] All imports should use direct paths (e.g., `from '../../utils/message-utils'` not `from '../../utils'`)


---

## 🚀 Compilation Performance: Watch Mode Fast Path

**Status:** 📋 Planned

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  File Change → IncrementalCompiler.rebuild() → Full build()            │
│     └─ runTsProgram (all changed files)                                 │
│     └─ generateOutputTargets (rolldown compiles)                        │
│     └─ writeBuild                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Problem:** Even a single-file change triggers the full pipeline.

### Solution: Leverage `transpileModule` for Watch Mode

The existing `transpileModule()` function (`src/compiler/transpile/transpile-module.ts`) already does single-file compilation with all necessary transforms. We can use it for a "fast path" in watch mode.

#### How `transpileModule` Works Today

1. Creates a fresh `ts.Program` for each call
2. Runs `convertDecoratorsToStatic` (extracts component metadata)
3. Runs output-target transforms (`lazyComponentTransform` or `nativeComponentTransform`)
4. Handles inheritance via `extraFiles` parameter
5. Returns: JS code, sourcemap, `moduleFile` with component metadata

#### Proposed Enhancement: Add Shared Context

```typescript
// Enhanced transpileModule signature
export const transpileModule = (
  config: d.ValidatedConfig,
  input: string,
  transformOpts: d.TransformOptions,
  context?: {
    // Reuse existing Program/TypeChecker from IncrementalCompiler
    program?: ts.Program;
    typeChecker?: ts.TypeChecker;
    // Update existing moduleMap instead of creating fresh
    compilerCtx?: d.CompilerCtx;
    // Access to component list for cross-component transforms
    buildCtx?: d.BuildCtx;
  },
): d.TranspileModuleResults => {
  // If context provided, reuse it; otherwise create fresh (current behavior)
  const compilerCtx = context?.compilerCtx ?? new CompilerContext();
  const buildCtx = context?.buildCtx ?? new BuildContext(config, compilerCtx);
  const typeChecker = context?.typeChecker ?? program.getTypeChecker();
  // ...
}
```

#### Watch Mode Fast Path

```
┌────────────────────────────────────────────────────────────────────┐
│  File Change Detected                                              │
├────────────────────────────────────────────────────────────────────┤
│  1. Quick check: is it a component file?                           │
│     ├─ NO (plain .ts) → Skip to step 5                             │
│     └─ YES → Continue...                                           │
│                                                                    │
│  2. transpileModule(source, opts, {                                │
│       program: incrementalCompiler.getProgram(),                   │
│       typeChecker: incrementalCompiler.getProgram().getTypeChecker(),
│       compilerCtx,                                                 │
│       buildCtx,                                                    │
│     })                                                             │
│     └─ Reuses existing TypeChecker (no fresh Program creation)     │
│     └─ Updates existing moduleMap entry                            │
│                                                                    │
│  3. Compare old vs new component metadata:                         │
│     - API changed (props/events/methods)? → Full rebuild           │
│     - JSDoc changed && docsOutputTargets.length > 0? → Regen docs  │
│     - Neither? → HOT SWAP only                                     │
│                                                                    │
│  4. If docs need regen: outputDocs() only (skip bundling)          │
│                                                                    │
│  5. Hot-swap module in dev server (skip rolldown entirely)         │
└────────────────────────────────────────────────────────────────────┘
```

### Implementation Plan

#### Phase 1: Add `context` Parameter to `transpileModule`

Allow reusing existing `Program`/`TypeChecker`/`CompilerCtx` from the watch build:

```typescript
// In watch-build.ts
const results = transpileModule(config, source, transformOpts, {
  program: incrementalCompiler.getProgram(),
  typeChecker: incrementalCompiler.getProgram()?.getTypeChecker(),
  compilerCtx,
  buildCtx,
});
```

**Benefits:**
- No fresh `ts.Program` creation per file (expensive)
- Shared type information for decorator resolution
- Updates existing `moduleMap` in-place

#### Phase 2: Implement Change Detection

```typescript
// In watch-build.ts, after transpileModule completes:
const oldMeta = compilerCtx.moduleMap.get(filePath)?.cmps[0];
const newMeta = results.moduleFile?.cmps[0];

// Check if public API changed
const apiChanged =
  JSON.stringify(oldMeta?.properties) !== JSON.stringify(newMeta?.properties) ||
  JSON.stringify(oldMeta?.events) !== JSON.stringify(newMeta?.events) ||
  JSON.stringify(oldMeta?.methods) !== JSON.stringify(newMeta?.methods);

// Check if JSDoc changed (only matters if docs output targets exist)
const hasDocsTargets = config.outputTargets.some(isOutputTargetDocs);
const jsDocChanged = hasDocsTargets && (
  JSON.stringify(oldMeta?.docs) !== JSON.stringify(newMeta?.docs) ||
  JSON.stringify(oldMeta?.docsTags) !== JSON.stringify(newMeta?.docsTags)
);

if (apiChanged) {
  // API changed - need full incremental rebuild (types, bundling, etc.)
  await triggerRebuild();
} else if (jsDocChanged) {
  // Only docs changed - regenerate docs, hot-swap module
  compilerCtx.moduleMap.set(filePath, results.moduleFile);
  await outputDocs(config, compilerCtx, buildCtx);
  devServer.hotSwapModule(filePath, results.code);
} else {
  // Internal change only - just hot-swap the module
  compilerCtx.moduleMap.set(filePath, results.moduleFile);
  devServer.hotSwapModule(filePath, results.code);
}
```

#### Phase 3: Non-Component Files Fast Path

For plain `.ts` files (utilities, services, etc.), we don't need any Stencil transforms:

```typescript
const isComponent = filePath.match(/\.tsx?$/) &&
  compilerCtx.moduleMap.get(filePath)?.cmps?.length > 0;

if (!isComponent) {
  // Plain TS file - just re-emit via TypeScript
  // No decorator extraction, no component transforms needed
  const result = ts.transpileModule(source, { compilerOptions });
  devServer.hotSwapModule(filePath, result.outputText);
  return;
}
```

### Change Detection Matrix

| Change Type | API Changed? | JSDoc Changed? | Action |
|-------------|--------------|----------------|--------|
| Internal logic only | ❌ | ❌ | Hot-swap module |
| JSDoc comment updated | ❌ | ✅ | Regen docs + hot-swap |
| New `@Prop()` added | ✅ | - | Full rebuild |
| Prop type changed | ✅ | - | Full rebuild |
| Component renamed | ✅ | - | Full rebuild |
| Style change | ❌ | ❌ | Existing CSS path |

### What Triggers Full Rebuild

- Component API changes (props, events, methods, states)
- New component added
- Component deleted
- Component tag name changed
- Inheritance chain changes

### Expected Impact

| Change Type | Current | With Fast Path |
|-------------|---------|----------------|
| Internal logic change | ~500ms-1s | **< 50ms** |
| JSDoc change (with docs targets) | ~500ms-1s | **< 100ms** |
| Style change | ~200ms | ~200ms (unchanged) |
| API change (new prop) | ~500ms-1s | ~500ms-1s (unchanged) |
| New component | ~500ms-1s | ~500ms-1s (unchanged) |

**~80% of dev changes are internal logic** → massive improvement for typical workflow.

---

## Output Target Modernization

### Overview

v5 renames output targets for clarity and elevates hidden sub-outputs to first-class citizens. This creates parity between distribution strategies and makes the architecture more modular.

### Name Changes

| v4 Name | v5 Name | Rationale |
|---------|---------|-----------|
| `dist` | **`loader-bundle`** | Describes what you get: loader infrastructure + bundled components |
| `dist-custom-elements` | **`standalone`** | Shorter, clearer: standalone component modules |
| `dist-hydrate-script` | **`ssr`** | Industry-standard term for server-side rendering |
| `dist-collection` (sub) | **`stencil-rebundle`** | First-class output: source + metadata for downstream Stencil projects to re-bundle |
| `dist-types` (sub) | **`types`** | First-class output: shared TypeScript definitions |

### Architecture Changes

#### Before v5 (Hidden Sub-Outputs)
```typescript
{
  outputTargets: [
    {
      type: 'dist',
      collectionDir: 'collection',  // Hidden sub-output
      typesDir: 'types'             // Hidden sub-output
    }
  ]
}
```

**Problems:**
- `dist-custom-elements` treated as afterthought
- Collection and types hidden as sub-outputs
- No parity between distribution strategies
- Confusing names for newcomers

#### After v5 (First-Class Outputs)
```typescript
{
  outputTargets: [
    { type: 'loader-bundle' },  // Auto-generates types + stencil-rebundle in prod
    { type: 'standalone' }       // Auto-generates types in prod
  ]
}
```

**Benefits:**
- All outputs are peers (no "primary" vs "afterthought")
- Types and stencil-rebundle auto-generated in production builds
- Clear, intuitive names
- Unified directory structure

### Directory Structure

All outputs now live under `dist/` by default:

```
dist/
├── loader-bundle/     # Lazy-loaded bundles + loader infrastructure
│   ├── esm/          # Lazy-loadable ES modules (includes loader.js)
│   ├── cjs/          # Optional CommonJS output (includes loader.cjs)
│   ├── <namespace>/  # Browser/CDN build
│   ├── index.js      # Main ESM entry
│   └── index.cjs     # Main CJS entry (if cjs: true)
├── standalone/        # Individual ES module per component
│   ├── index.js
│   ├── my-component.js
│   └── my-component.d.ts
├── stencil-rebundle/      # Metadata for downstream Stencil projects
│   ├── collection-manifest.json
│   ├── stencil.config.json  # NEW: Upstream config for merging
│   └── components/
├── types/            # Shared TypeScript definitions
│   ├── components.d.ts
│   └── loader.d.ts   # Types for defineCustomElements, setNonce
└── ssr/              # Server-side rendering / hydration
    └── index.js
```

**Note:** The separate `dist/loader/` directory has been removed. The `./loader` export in package.json now points directly to `loader-bundle/esm/loader.js` (and `loader-bundle/cjs/loader.cjs` for CJS). Types are in `types/loader.d.ts`.

### Auto-Generated Outputs

In **production builds** (`!config.devMode`), the compiler automatically adds:

1. **`types`** output (unless explicitly configured)
   - Default dir: `dist/types/`
   - `skipInDev: true`
   - Shared by `loader-bundle` and `standalone`

2. **`stencil-rebundle`** output (unless explicitly configured)
   - Default dir: `dist/stencil-rebundle/`
   - `skipInDev: true`
   - Contains component metadata + upstream config for downstream merging

Power users can override:
```typescript
{
  outputTargets: [
    { type: 'loader-bundle' },
    { type: 'types', dir: 'custom-types', skipInDev: false }  // Explicit wins
  ]
}
```

### Stencil Metadata Enhancements

The new `stencil-rebundle` output extends the old collection with:

1. **`stencil.config.json`** - Upstream config for downstream merging
   ```json
   {
     "namespace": "my-lib",
     "externalRuntime": true,
     "buildOptions": { /* ... */ }
   }
   ```

2. **Downstream consumption**:
   ```typescript
   import upstreamConfig from 'my-lib/stencil-rebundle/stencil.config.json';

   export const config = mergeStencilConfigs(upstreamConfig, {
     // My overrides
   });
   ```

**Solves:** Config loss when using `externalRuntime: true` in `standalone` output

### Migration

The `stencil migrate` command handles automatic migration:

**Detects:**
- `type: 'dist'` → `type: 'loader-bundle'`
- `type: 'dist-custom-elements'` → `type: 'standalone'`
- `type: 'dist-hydrate-script'` → `type: 'ssr'`
- `collectionDir` in config → extracts to standalone `stencil-rebundle` output
- `typesDir` in config → extracts to standalone `types` output

**Example migration:**
```typescript
// Before
{
  outputTargets: [
    {
      type: 'dist',
      collectionDir: 'custom/collection',
      typesDir: 'custom/types'
    }
  ]
}

// After (auto-migrated)
{
  outputTargets: [
    { type: 'loader-bundle' },
    { type: 'stencil-rebundle', dir: 'custom/collection' },
    { type: 'types', dir: 'custom/types' }
  ]
}
```

### Implementation Status

- [x] Update output target constants
- [x] Update public type definitions
- [x] Rename validator files
- [x] Update output target implementations
- [x] Create first-class `stencil-rebundle` and `types` outputs
- [x] Add auto-generation logic for prod builds
- [x] Update all tests
- [x] Add migration CLI logic (`stencil migrate` automatically updates configs)

---

## Global Styles & Assets Modernization

### Problem Statement

In v4, global styles and assets were tightly coupled to `loader-bundle` (formerly `dist`) and `www` outputs:

**Global Styles:**
- `loader-bundle` outputs `dist/loader-bundle/{namespace}/{namespace}.css`
- `www` outputs `www/build/{namespace}.css`
- `standalone` only embeds styles in components - **no standalone CSS file**
- `ssr` has no CSS file output

**Assets (component `assetsDirs`):**
- `loader-bundle` copies to `dist/loader-bundle/{namespace}/...`
- `www` copies to `www/build/...`
- `standalone` **does not auto-copy assets** - requires manual `copy` config
- Assets duplicated across output directories

This creates friction for users who want:
- Global styles available for `standalone` consumers
- A single assets location for all outputs
- Simpler DX without manual copy configuration

### Solution: Unified Output Targets

#### New `global-style` Output Target

```typescript
// Explicit configuration
{
  type: 'global-style',
  dir: 'dist/assets',           // Default location
  skipInDev: false,             // Needed for dev - default false
  copyToLoaderBrowser: true,    // Backwards compat - also copy to loader-bundle dir
}
```

**Auto-generation logic:**
```typescript
if (config.globalStyle && !hasExplicitGlobalStyleOutput) {
  outputs.push({
    type: 'global-style',
    dir: 'dist/assets',
    skipInDev: false,
    copyToLoaderBrowser: true,  // Default for backwards compat
  });
}

// When processing outputs:
if (hasLoaderBundleOutput && globalStyleOutput.copyToLoaderBrowser) {
  // Also copy: dist/assets/{namespace}.css → dist/loader-bundle/{namespace}/{namespace}.css
}
```

**Result:**
- Primary: `dist/assets/{namespace}.css` (available to all outputs)
- Compat copy: `dist/loader-bundle/{namespace}/{namespace}.css` (existing CDN consumers)

#### New `assets` Output Target

```typescript
// Explicit configuration
{
  type: 'assets',
  dir: 'dist/assets',           // Default location
  skipInDev: false,             // Needed for dev - default false
}
```

**Auto-generation logic:**
```typescript
if (hasComponentsWithAssetsDirs && !hasExplicitAssetsOutput) {
  outputs.push({
    type: 'assets',
    dir: 'dist/assets',
    skipInDev: false,
  });
}
```

**Note:** Unlike `global-style`, assets don't need `copyToLoaderBrowser` - all asset access goes through `getAssetPath()` / `setAssetPath()` runtime helpers, so path resolution is handled dynamically.

**Implementation approach:** Remove existing `copyAssets` logic from `loader-bundle` and `www` validators entirely. The new `assets` output becomes the single source of truth - no duplication across output directories. This is a clean break enabled by runtime `getAssetPath()` resolution.

### Directory Structure

```
dist/
├── assets/                      # NEW: Unified location
│   ├── {namespace}.css          # Global styles
│   └── {component}/             # Component assetsDirs
│       └── images/
│           └── logo.png
├── loader-bundle/
│   ├── {namespace}/
│   │   └── {namespace}.css      # Compat copy (if copyToLoaderBrowser on global-style)
│   └── ...
├── standalone/
├── types/
└── ssr/
```

**Note:** Assets only exist in `dist/assets/` - no duplication. Runtime `getAssetPath()` resolves paths dynamically. Global styles optionally copied to loader-bundle for backwards compat with hardcoded `<link>` tags.

### www Symlink Strategy

For `www` output (dev server target), use symlinks in dev for performance:

```typescript
// In www output validation:
if (config.devMode) {
  // DEV: Symlink to shared assets dir (fast)
  outputs.push({
    type: 'www-assets-link',     // Internal type
    src: 'dist/assets',
    dest: 'www/build/assets',
    symlink: true,
  });
} else {
  // PROD: Full copy for standalone deployable www
  outputs.push({
    type: COPY,
    src: 'dist/assets',
    dest: 'www/build/assets',
  });
}
```

### Runtime: `getAssetPath()` Resolution

With unified `dist/assets/` location, auto-configure asset base in standalone:

```typescript
// Auto-generated in dist/standalone/index.js
import { setAssetPath } from '@stencil/core';
const __assetBase = new URL('../assets/', import.meta.url).href;
setAssetPath(__assetBase);

// Component code:
getAssetPath('./images/logo.png')
// → Resolves to: ../assets/{component}/images/logo.png
```

### Config API

Existing config options preserved:

```typescript
// stencil.config.ts
{
  globalStyle: './src/global.css',  // Existing API unchanged
  outputTargets: [
    { type: 'loader-bundle' },
    { type: 'standalone' },
    // 'global-style' and 'assets' auto-generated
  ]
}
```

Power users can override:

```typescript
{
  globalStyle: './src/global.css',
  outputTargets: [
    { type: 'loader-bundle' },
    { type: 'standalone' },
    // Explicit config wins over auto-generation
    {
      type: 'global-style',
      dir: 'dist/css',              // Custom location
      copyToLoaderBrowser: false,   // Opt out of compat copy
    },
    {
      type: 'assets',
      dir: 'dist/static',           // Custom location
    },
  ]
}
```

### CDN Usage

**Before (v4):**
```html
<script src="https://cdn.com/dist/loader-bundle/mylib/mylib.esm.js"></script>
<link href="https://cdn.com/dist/loader-bundle/mylib/mylib.css" rel="stylesheet">
```

**After (v5) - both work:**
```html
<!-- New unified location -->
<script src="https://cdn.com/dist/loader-bundle/mylib/mylib.js"></script>
<link href="https://cdn.com/dist/assets/mylib.css" rel="stylesheet">

<!-- Or legacy location (via copyToLoaderBrowser) -->
<script src="https://cdn.com/dist/loader-bundle/mylib/mylib.js"></script>
<link href="https://cdn.com/dist/loader-bundle/mylib/mylib.css" rel="stylesheet">
```

### Standalone Usage

```typescript
// Now works without manual copy config!
import { MyComponent } from 'mylib/standalone';
import 'mylib/dist/assets/mylib.css';

// Or via package.json exports:
import 'mylib/styles';
```

### Breaking Changes

- **`dist-global-styles` internal type removed** - replaced by `global-style` output
- **`copyAssets` option removed** from `loader-bundle` and `www` output targets
- **Asset location changed** - from output-specific dirs to unified `dist/assets/`
- **Global styles backwards compat** via `copyToLoaderBrowser: true` default (for hardcoded `<link>` tags)
- **Assets: no backwards compat needed** - `getAssetPath()` runtime resolution handles path changes

### Migration

The `stencil migrate` command will:
1. Detect existing `globalStyle` config
2. Add explicit `global-style` output if custom behavior needed
3. Add explicit `assets` output if custom behavior needed
4. Update package.json exports for new asset locations

### Implementation Status

**Completed:**
- [x] Define `OutputTargetGlobalStyle` type (`stencil-public-compiler.ts`)
- [x] Define `OutputTargetAssets` type (`stencil-public-compiler.ts`)
- [x] Add `GLOBAL_STYLE` and `ASSETS` constants (`constants.ts`)
- [x] Add `isOutputTargetGlobalStyle` and `isOutputTargetAssets` type guards (`output-target.ts`)
- [x] Add to `VALID_CONFIG_OUTPUT_TARGETS` array
- [x] Update `OutputTarget` union type to include new types
- [x] Create `validate-global-style.ts` validator
- [x] Create `validate-assets.ts` validator
- [x] Wire validators into `outputs/index.ts`
- [x] Update auto-generation logic in `autoGenerateOutputs()`:
  - `global-style` auto-generated when `config.globalStyle` exists (dev + prod)
  - `assets` always auto-generated (dev + prod)
- [x] Remove `copyAssets` from `validate-loader-bundle.ts`
- [x] Remove `copyAssets` from `validate-www.ts`
- [x] Remove `copyAssets` property from `OutputTargetCopy` interface
- [x] Remove `getComponentAssetsCopyTasks` calls from `output-copy.ts`
- [x] Update tests in `validate-output-loader-bundle.spec.ts` and `validate-output-www.spec.ts`

- [x] Create `output-global-style.ts` generator (writes CSS to `dist/assets/{namespace}.css`)
- [x] Create `output-assets.ts` generator (copies component assetsDirs to `dist/assets/`)
- [x] Wire generators into `output-targets/index.ts`
- [x] Implement `copyToLoaderBrowser` logic (copy CSS to loader-bundle dir for backwards compat)
- [x] Remove `DIST_GLOBAL_STYLES` from loader-bundle and www validators
- [x] Update `generateGlobalStyles` to only build/cache CSS (no file writes)
- [x] Update tests in `validate-output-standalone.spec.ts`

- [x] Copy assets to www build directories (in `output-assets.ts`)
- [x] Auto-configure `setAssetPath()` in standalone index.js (relative path to assets dir)

**Remaining:**
- [x] ~~Update migration CLI~~ - Not needed, changes are backwards compatible (auto-generated outputs, `getAssetPath()` handles paths)
- [ ] Add comprehensive tests for new output targets
- [ ] Update documentation

**Decision:** Skipped www symlink strategy - the ~200-500ms copy time is negligible compared to TS compilation. Complexity of cross-platform symlinks not worth the marginal gain.

**Files Modified:**
- `packages/core/src/declarations/stencil-public-compiler.ts` - Added types
- `packages/core/src/utils/constants.ts` - Added constants
- `packages/core/src/utils/output-target.ts` - Added type guards
- `packages/core/src/compiler/config/outputs/validate-global-style.ts` - NEW
- `packages/core/src/compiler/config/outputs/validate-assets.ts` - NEW
- `packages/core/src/compiler/config/outputs/index.ts` - Wired validators + auto-generation
- `packages/core/src/compiler/config/outputs/validate-loader-bundle.ts` - Removed copyAssets + DIST_GLOBAL_STYLES
- `packages/core/src/compiler/config/outputs/validate-www.ts` - Removed copyAssets + DIST_GLOBAL_STYLES
- `packages/core/src/compiler/output-targets/copy/output-copy.ts` - Removed getComponentAssetsCopyTasks
- `packages/core/src/compiler/output-targets/output-global-style.ts` - NEW generator
- `packages/core/src/compiler/output-targets/output-assets.ts` - NEW generator
- `packages/core/src/compiler/output-targets/index.ts` - Wired new generators
- `packages/core/src/compiler/style/global-styles.ts` - Updated to only build/cache CSS
- `packages/core/src/compiler/config/_test_/validate-output-loader-bundle.spec.ts` - Updated tests
- `packages/core/src/compiler/config/_test_/validate-output-www.spec.ts` - Updated tests
- `packages/core/src/compiler/config/_test_/validate-output-standalone.spec.ts` - Updated tests
- `packages/core/src/compiler/output-targets/standalone/index.ts` - Auto-configure setAssetPath() for components with assets

**Build Status:** ✅ Compiles successfully

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

*Last updated: 2026-04-27*
