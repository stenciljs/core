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

### 8.a Document ALL BREAKING CHANGES

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
- **Global styles and assets modernized:**
  - New `global-style` output target (first-class, auto-generated when `globalStyle` config exists)
  - New `assets` output target (first-class, auto-generated when components have `assetsDirs`)
  - Unified location: `dist/assets/` for both global styles and component assets
  - `copyAssets` option removed from `loader-bundle` and `www` output targets
  - Global styles: `copyToLoaderBrowser: true` default copies CSS to loader-bundle dir for backwards compat
  - Assets: No backwards compat copy needed - `getAssetPath()` runtime resolution handles path changes
- **`esmLoaderPath` config option renamed to `loaderPath`** in `loader-bundle` output target. The new name better reflects that it applies to all module formats, not just ESM.
- **New `browserBundlePath` config option** in `loader-bundle` output target. Controls where the browser/CDN bundle is written relative to `buildDir`. Default is `''` (writes to `buildDir/<namespace>/`). Set to `'../'` to restore v4 behavior where browser bundles were at `dist/<namespace>/` instead of `dist/loader-bundle/<namespace>/`.

### 8.b Document ALL NEW FEATURES

- **`global-style` output target now supports explicit `input`** - specify CSS source file directly on output target instead of using `globalStyle` config
- **`global-style` output target now supports `fileName`** - customize output filename (defaults to basename of input, or `{namespace}.css` for globalStyle compat)
- **Multiple `global-style` outputs supported** - build separate CSS bundles from different input files
- **Warning when both approaches used** - emits build warning if both `globalStyle` config and explicit `input` are configured
- **New `www` can now use standalone loader

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
- Works great with GitHub Actions8

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

- **Don't bundle TypeScript/terser/parse5** - Use as normal dependencies
- **Pure ESM everywhere** - No CJS internally
- **Keep Terser over SWC for minification** - SWC cannot fully constant-fold `BUILD.*` object properties; produces ~18 KB vs Terser's ~11.8 KB for the runtime bundle. Revisit when SWC matures. (Investigated April 2026)

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
│   ├── loader/       # Loader utilities (defineCustomElements, etc.)
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

Supports two configuration approaches:

**1. Implicit (backwards compat):** Use `globalStyle` config, output is auto-generated
```typescript
{
  globalStyle: './src/global.css',  // Auto-generates global-style output
  outputTargets: [...]
}
```

**2. Explicit:** Define output target with `input` property for full control
```typescript
{
  type: 'global-style',
  input: './src/theme.css',     // CSS input file (takes precedence over globalStyle config)
  fileName: 'theme.css',        // Output filename (default: basename of input, or {namespace}.css)
  dir: 'dist/assets',           // Default location
  skipInDev: false,             // Needed for dev - default false
  copyToLoaderBrowser: true,    // Backwards compat - also copy to loader-bundle dir
}
```

**Multiple global styles supported:**
```typescript
outputTargets: [
  { type: 'global-style', input: './src/theme.css', fileName: 'theme.css' },
  { type: 'global-style', input: './src/utils.css', fileName: 'utils.css' },
]
```

**Auto-generation logic:**
```typescript
// Only auto-generate if globalStyle is set AND no explicit global-style outputs exist
if (config.globalStyle && explicitGlobalStyles.length === 0) {
  outputs.push({
    type: 'global-style',
    // input is set from config.globalStyle during validation
  });
}

// Warn if both approaches used
if (config.globalStyle && hasExplicitGlobalStyleWithInput) {
  warn('Both "globalStyle" config and explicit "global-style" with "input" are configured. Choose one approach.');
}
```

**Caching:** CSS is cached per-input-path in `compilerCtx.globalStyleCache`. Same input file is only built once per build, even if referenced by multiple output targets.

**Result:**
- Primary: `dist/assets/{fileName}` (available to all outputs)
- Compat copy: `dist/loader-bundle/{namespace}/{fileName}` (existing CDN consumers, if copyToLoaderBrowser)

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

Power users can override with explicit `input`:

```typescript
{
  // No globalStyle needed when using explicit input
  outputTargets: [
    { type: 'loader-bundle' },
    { type: 'standalone' },
    // Explicit global-style with full control
    {
      type: 'global-style',
      input: './src/theme.css',     // Explicit input file
      fileName: 'theme.css',        // Custom output filename
      dir: 'dist/css',              // Custom location
      copyToLoaderBrowser: false,   // Opt out of compat copy
    },
    // Multiple CSS bundles supported
    {
      type: 'global-style',
      input: './src/utilities.css',
      fileName: 'utilities.css',
      dir: 'dist/css',
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

### Migration

The `stencil migrate` command will:
1. Detect existing `globalStyle` config
2. Add explicit `global-style` output if custom behavior needed
3. Add explicit `assets` output if custom behavior needed
4. Update package.json exports for new asset locations

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

*Last updated: 2026-04-29*
