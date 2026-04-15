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
  - `dist-collection` (sub-output) → `stencil-meta` (first-class output, default dir: `dist/stencil-meta/`, auto-generated in prod)
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
- **`isPrimaryPackageOutputTarget` removed from output targets.** Package.json validation now auto-detects based on configured outputs. Remove this property from your output target configs.
- **`validatePrimaryPackageOutputTarget` config option renamed to `validatePackageJson`.** The validation logic now automatically determines recommended values based on which output targets are configured, rather than requiring manual designation of a "primary" output.
- **Export maps generation uses smart defaults.** When generating export maps, Stencil now checks if existing exports are valid before overwriting. Priority: `loader-bundle` > `standalone` for the root export. Types always come from the `types` output target.

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
| `dist-collection` (sub) | **`stencil-meta`** | First-class output: metadata for Stencil-to-Stencil consumption |
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
    { type: 'loader-bundle' },  // Auto-generates types + stencil-meta in prod
    { type: 'standalone' }       // Auto-generates types in prod
  ]
}
```

**Benefits:**
- All outputs are peers (no "primary" vs "afterthought")
- Types and stencil-meta auto-generated in production builds
- Clear, intuitive names
- Unified directory structure

### Directory Structure

All outputs now live under `dist/` by default:

```
dist/
├── loader-bundle/     # Lazy-loaded bundles + loader infrastructure
│   ├── esm/          # Lazy-loadable ES modules
│   ├── loader/       # Loader entry point
│   └── cjs/          # Optional CommonJS output
├── standalone/        # Individual ES module per component
│   ├── index.js
│   ├── my-component.js
│   └── my-component.d.ts
├── stencil-meta/      # Metadata for downstream Stencil projects
│   ├── collection-manifest.json
│   ├── stencil.config.json  # NEW: Upstream config for merging
│   └── components/
├── types/            # Shared TypeScript definitions
│   └── components.d.ts
└── ssr/              # Server-side rendering / hydration
    └── index.js
```

### Auto-Generated Outputs

In **production builds** (`!config.devMode`), the compiler automatically adds:

1. **`types`** output (unless explicitly configured)
   - Default dir: `dist/types/`
   - `skipInDev: true`
   - Shared by `loader-bundle` and `standalone`

2. **`stencil-meta`** output (unless explicitly configured)
   - Default dir: `dist/stencil-meta/`
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

The new `stencil-meta` output extends the old collection with:

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
   import upstreamConfig from 'my-lib/stencil-meta/stencil.config.json';

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
- `collectionDir` in config → extracts to standalone `stencil-meta` output
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
    { type: 'stencil-meta', dir: 'custom/collection' },
    { type: 'types', dir: 'custom/types' }
  ]
}
```

### Implementation Status

- [x] Update output target constants
- [x] Update public type definitions
- [x] Rename validator files
- [x] Update output target implementations
- [x] Create first-class `stencil-meta` and `types` outputs
- [x] Add auto-generation logic for prod builds
- [x] Update all tests
- [x] Add migration CLI logic (`stencil migrate` automatically updates configs)

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

*Last updated: 2026-04-14*
