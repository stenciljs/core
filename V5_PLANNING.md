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
- **`streamToString()` return type changed** from Node.js `Readable` to web-standard `ReadableStream<string>`. Works in Node 22+, Cloudflare Workers, Deno, Bun, and all WinterCG runtimes.
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
- **`standalone` output target: `externalRuntime` now defaults to `false`**. The runtime is bundled as a shared local chunk rather than kept as an external `@stencil/core/runtime/client` import. Set `externalRuntime: true` if you need multiple Stencil component libraries on the same page to share a single runtime instance (e.g., for `setNonce`/`setTagTransformer` to propagate across libraries).
- **`esmLoaderPath` config option renamed to `loaderPath`** in `loader-bundle` output target.
- **`hashFileNames` and `hashedFileNameLength` moved from top-level config to `loader-bundle` and `www` output targets.** Only these two targets serve bundles directly in the browser. Run `stencil migrate` to remove them from the top-level config, then add to your output targets if non-default values are needed.

---

## New Features

- **`global-style` output target now supports explicit `input`** - specify CSS source file directly on output target instead of using `globalStyle` config
- **`global-style` output target now supports `fileName`** - customize output filename
- **`global-style` output target now supports `inject`** - control whether styles are injected into component shadow DOMs (`'none'`, `'client'`, `'all'`)
- **Multiple `global-style` outputs supported** - build separate CSS bundles from different input files, each with independent `inject` settings
- **`www` can now use standalone loader**
- **`@Component` now supports `globalStyleUrl` and `globalStyle`**  co-locate document-level styles with the component. Styles are collected at build time and injected wherever `@import "stencil-globals"` appears in a global stylesheet. Works for all encapsulation types (shadow, scoped, none). No mode variants  CSS handles runtime variants via selectors or custom properties. Changes to `globalStyleUrl` files invalidate the global style build cache and trigger HMR correctly.
- **`@import "stencil-hydrate"` virtual placeholder**  add to any `global-style` input to inject static FOUC-prevention CSS at build time instead of relying on the dynamic `<style>` tag inserted by the loader. The compiler replaces the placeholder with the sorted component selectors + configured hydration CSS (e.g. `my-cmp,other-cmp{visibility:hidden}.hydrated{visibility:inherit}`). When detected, `BUILD.staticHydrationStyles = true` suppresses the loader's dynamic injection. For `standalone` builds (which have no loader), `stencil-hydrate.css` is auto-generated alongside the bundle.
- **`loader-bundle` now supports `externalRuntime`**  set `externalRuntime: true` on the `loader-bundle` output target to mark `@stencil/core` as an external dependency in the ESM/CJS distribution output. Only affects the bundler variant; the browser/CDN build always includes the runtime. Useful when consumers already depend on `@stencil/core` and want to avoid bundling a second copy.
- **setTagTransformer** - is now exported by default from your bundle entry point (same as `setNonce`), so library authors no longer need to manually re-export it from their `index.ts`. 
- **Scoped Custom Element Registries** - always available, no config flag required. Pass a `CustomElementRegistry` instance and Stencil defines all components in it instead of `window.customElements`. What you do with that registry (attaching it to shadow roots, scoped DOM subtrees, etc.) is up to you.
  - **Standalone per-component**: `defineCustomElement({ registry })` - stamps `._registry` on the class and registers in the scoped registry.
  - **Standalone auto-loader / lazy loader**: pre-configure with `setRegistry(registry)` before the bundle loads. All components will be defined in the provided registry.
  - **Shadow components**: `attachShadow({ customElementRegistry: registry })` is set automatically so nested components inside a shadow root resolve from the same registry.

  Requires native SCER support (Chrome ≥ 100, Safari ≥ 2025-01) or the `@webcomponents/scoped-custom-element-registry` polyfill. Example:
  ```js
  import { setRegistry, defineCustomElements } from 'my-lib/loader';
  const registry = new CustomElementRegistry();
  setRegistry(registry);
  await defineCustomElements();
  ```
- **`setTagTransformer` auto-exported** - now auto-injected into generated library entry points (same as `setNonce`), so library authors no longer need to manually re-export it from their `index.ts`.
- **Signals** - opt-in signal-backed reactivity via `extras.signalBacking: true`. Zero API changes for component authors; `@State` and `@Prop` are backed by `@preact/signals-core` signals internally. New `@stencil/core/signals` subpath exports `signal`, `computed`, `effect`, `batch`, `untracked`, `@Effect()`, `getSignal<T>()`, and `STENCIL_SIGNALS_SYMBOL` for cross-framework interop. Signal values are valid JSX children and attributes - DOM updates bypass the vdom diff entirely. `@Prop`-only signals are exposed on the host element via `Symbol.for('stencil.signals')` for framework adapters without requiring a `@stencil/core` import.
- **`stencil init` wizard** — ground-up redesign of project scaffolding and capability management. Context-aware: scaffolds a new project from the `component-starter` template, or runs in "add capabilities" mode on an existing project. Third-party packages participate by exporting a `wizard` object from a `stencil.wizard` entry declared in their `package.json` — no central registry. The `init` contribution's `run(context)` function owns its entire setup (prompts, peer dep installs, config file writes, example tests, script updates), matching the pattern used by `@nuxt/test-utils`. `generate` contributions add file templates and style extensions to `stencil generate`. `STENCIL_WIZARD_DEV=./path/to/wizard.js` injects a local wizard during development without publishing. Replaces `create-stencil` as the primary project bootstrapping path.

---

## Tasks

### 🚀 Zero-Config DX (In Progress)

Stencil is now 90%+ design systems, not apps. The DX should reflect that - `npx stencil build --dev --serve` in a directory with some `.tsx` files should just work.

**Key decisions:**
- No `stencil.config.ts` required - the compiler already handles a missing config gracefully (`loadConfig` has a "which is fine" path)
- Default output is `loader-bundle`, not `www` - reflects the design system use case
- Namespace derives from `package.json#name` (scope-stripped) → directory name → `'App'` as last resort
- `validateDistNamespace` removed - derivation makes the "don't use App" guard unnecessary

**What's done:**
- [x] Default output changed from `www` to `loader-bundle` (`outputs/index.ts`)
- [x] `validate-www.ts` no longer handles defaulting - only validates explicit `www` outputs
- [x] Namespace auto-derived from `package.json` / directory name (`validate-namespace.ts`)
- [x] `validateDistNamespace` removed
- [x] `src/global.{css,scss,sass}` auto-detected → `config.globalStyle` if not set
- [x] `src/global.{ts,js}` auto-detected → `config.globalScript` if not set

**What's next:**

#### ~~Auto-generate `tsconfig.json`~~ ✅
- The mechanism already existed behind an `initTsConfig` flag that was never activated
- Removed the flag - tsconfig is now always auto-written when missing (`typescript-config.ts`)
- Updated template for v5: `moduleResolution: bundler`, `lib: [dom, ES2017]`, `strict: true`, dropped `sourceMap`/`inlineSources` (Stencil overrides at runtime)
- Target version check now uses `< ES2017` comparison instead of deprecated `ES3`/`ES5` enum values

#### ~~Dev server: no `index.html` required~~ ✅
Default behaviour for any project **without a `www` output** (no-config or explicit config using `loader-bundle`/`standalone`):

- `/` → redirects to `/src/` if it exists, otherwise shows dir listing
- **Dir has `.tsx` files + no `.html` files** → per-directory component preview (only components from that dir), with loader `<script>` and global CSS `<link>`
- **Dir has an `.html` file** → dir listing as usual (user can click through to their own page)
- `www` projects are unaffected - their server root is `www.appDir`, not the project root

This is filesystem-driven with no config gating - any non-www project benefits automatically.

---

### 🌍 `ssr-wasm` Output Target ✅ Complete

Compiles the SSR script to a standalone `.wasm` binary via [Extism PDK](https://extism.org/) + QuickJS-ng, callable from any language with a WASM runtime (PHP, Java, Ruby, Go, Rust, etc.).

**How it works:**
- Bundles SSR script with rolldown (IIFE, ES2020 target for QuickJS-ng compat), no Node built-ins
- Timer APIs polyfilled (QuickJS-ng doesn't provide `setTimeout` etc.)
- Extism host exports: `renderToString()`, `setTagTransformer()`, `resetSsrDocData()` — data via `Host.inputString()`/`Host.outputString()`
- `extism-js` CLI compiles `index.js` + `plugin.d.ts` → `index.wasm`; graceful warning if `extism-js` not installed
- CI: Ubuntu, Node 22 + 24 (`test-ssr-wasm.yml`)

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

## 🧙 CLI Wizard & Scaffolding (Planned)

A ground-up redesign of Stencil's project init and code generation DX. Goals: single source of truth in this monorepo, pluggable via an open protocol, visually modern, no separate repo to maintain.

### Command surface

| Command | Description |
|---------|-------------|
| `stencil init` | New project wizard **or** add capabilities to existing project (context-aware) |
| `stencil generate [name]` | Enhanced component/style scaffolding (existing command, upgraded) |
| `npm create stencil` | Thin shim → delegates to `npx @stencil/cli@latest init` |

`stencil init` detects context: if `stencil.config.ts` is already present it runs in "add capabilities" mode rather than scaffolding a new project from scratch. One entry point, no `stencil add` command needed.

### New package: `@stencil/templates` (`packages/templates/`)

Versioned lockstep with core/cli. Contains:

```
packages/templates/src/
  project/
    component-starter/        ← replaces stenciljs/component-starter GitHub repo
      package.json
      stencil.config.ts
      tsconfig.json
      src/components/my-component/
        my-component.tsx
        my-component.css
  generate/
    component.ts              ← template functions for stencil generate
    style.ts
    # No test templates - those live in @stencil/vitest / @stencil/playwright
```

**No template engine needed for project templates** - they are mostly static files, simple `str.replace()` for project name interpolation (same approach as `create-vite`, `create-next-app`). Generate templates are TypeScript functions (as they are today), just moved here.

Custom/community project templates use `giget` via URL: `stencil init --template github:my-org/my-template`.

### Plugin wizard protocol

Any installed package can participate in `stencil init` and `stencil generate` by declaring a `stencil.wizard` path in its `package.json`:

```json
// @stencil/vitest/package.json
{ "stencil": { "wizard": "./dist/wizard.js" } }
```

The wizard module exports a `StencilWizardPlugin` object:

```ts
// @stencil/vitest/src/wizard.ts
import { confirm, multiselect, isCancel, cancel } from '@clack/prompts';
import { addDependency } from 'nypm';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export const wizard: StencilWizardPlugin = {
  // Contributes to `stencil generate` — file templates offered per-component
  generate: {
    fileTemplates: [
      {
        label: 'Spec test (.spec.tsx)',
        extension: 'spec.tsx',
        template: (tagName, className) => `...vitest boilerplate for ${className}...`,
      },
    ],
  },
  // Contributes to `stencil init` — owns its entire setup wizard
  init: {
    id: 'vitest',
    displayName: 'Vitest',
    description: 'Unit + component testing',
    async run({ rootDir, isNewProject }) {
      // Full interactive wizard — own prompts, branching logic, file generation
      const scope = await multiselect({
        message: 'What kind of tests do you need?',
        options: [
          { value: 'unit',    label: 'Unit tests',      hint: 'pure functions, no DOM' },
          { value: 'browser', label: 'Browser / component', hint: 'real DOM via Playwright' },
        ],
      });
      if (isCancel(scope)) { cancel('Setup cancelled.'); process.exit(0); }

      // Install peer deps based on answers
      const deps = ['vitest'];
      if (scope.includes('browser')) deps.push('@vitest/browser', 'playwright');
      await addDependency(deps, { cwd: rootDir, dev: true });

      // Generate vitest.config.ts tailored to answers
      await writeFile(join(rootDir, 'vitest.config.ts'), generateVitestConfig(scope), 'utf8');

      // Create test directories, example files, update package.json scripts, etc.
    },
  },
}
```

**Key principle — the plugin IS the wizard for its own setup.** The CLI's only job is to install the top-level package and then call `run(context)`. Everything inside `run()` is the package's responsibility: prompting, installing peer deps, creating config files, writing example tests, updating `.gitignore`, adding package.json scripts. This matches the pattern used by `@nuxt/test-utils`.

**`WizardContext` passed to `run()`:**
```ts
export interface WizardContext {
  rootDir: string;      // absolute path to the project root
  isNewProject: boolean; // true if stencil.config.ts did not previously exist
}
```

**`WizardInitContribution` — the shape a plugin's `init` export must satisfy:**
```ts
export interface WizardInitContribution {
  id: string;           // stable deduplication key
  displayName: string;  // shown in the selection prompt
  description: string;  // hint shown alongside displayName
  run: (context: WizardContext) => Promise<void>;
}
```

**Discovery:** at wizard runtime, the CLI scans installed packages for the `stencil.wizard` field and dynamically imports matching modules. No central registry. Whatever is installed participates.

**Impact on `stencil generate`:**
Any installed package that exports a `stencil.wizard` with a `generate` contribution automatically participates — no CLI changes needed. Style extensions and file templates are purely plugin-driven. If no plugins are installed, no extra prompts appear.

### Dependency changes

| Remove | Add |
|--------|-----|
| `prompts` | `@clack/prompts` |
| `yauzl`, `node-fetch` (in create-stencil) | - |
| - | `nypm` (package manager detection + install) |
| - | `std-env` (CI/TTY detection - skip wizard in CI) |

### `stencil init` — CLI flow

`discoverPlugins` only finds packages that are *already installed*, so a fresh project gets no options. `task-init.ts` solves this with a two-phase flow:

1. **Well-known list baked into the CLI** — just names + display info, zero behavior:
   ```ts
   const KNOWN_INTEGRATIONS = [
     { package: '@stencil/vitest',     displayName: 'Vitest',     description: 'Unit testing' },
     { package: '@stencil/playwright', displayName: 'Playwright', description: 'E2E testing' },
     { package: '@stencil/sass',       displayName: 'Sass',       description: 'Sass/SCSS styles' },
   ];
   ```
   User picks from this list. CLI installs the selected packages.

2. **Re-discover after install** — `discoverPlugins` runs again. For each selected package that exposes a `stencil.wizard` with an `init` contribution, the CLI calls `plugin.init.run(context)`. The plugin owns everything from here: its own prompts, peer dep installs, config file generation, example tests, package.json script updates, etc.

For **existing projects**, the CLI runs `discoverPlugins` immediately. Already-installed packages with `init.run` contributions appear in a "Configure existing integrations" group alongside the uninstalled KNOWN_INTEGRATIONS. Selecting one calls its `run()` — the plugin is responsible for detecting what's already set up and skipping or adapting accordingly.

**Key property:** the CLI only knows *what to call* — not *what it does*. All setup logic stays in the packages. A change to how `@stencil/vitest` sets itself up is a `@stencil/vitest` release, not a CLI release. Community packages work identically — they just don't appear in the well-known list.

**Type separation:** `WizardInitContribution` is the shape a plugin exports. `KnownIntegration` (just `package` + display info) lives in `task-init.ts` for the CLI-side list — the two concerns stay separate.

---

### What happens to `create-stencil`

The separate repo is retired as an active package. `npm create stencil` continues to work because `create-stencil` on npm becomes a permanent thin shim:

```js
#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
spawnSync('npx', ['@stencil/cli@latest', 'init', ...process.argv.slice(2)], { stdio: 'inherit' })
```

### File structure in `@stencil/cli`

```
packages/cli/src/
  wizard/
    types.ts              # StencilWizardPlugin, WizardContext interfaces
    discover.ts           # scan node_modules for "stencil.wizard" field
    clack.ts              # shared @clack/prompts helpers (cancel guard, etc.)
    generate/
      steps.ts            # generate wizard steps (style ext, test files)
    init/
      steps.ts            # init wizard steps (template, output targets, styling, testing)
      apply.ts            # write files, update package.json, install deps
  task-init.ts            # new: stencil init
  task-generate.ts        # existing: upgraded to @clack/prompts + plugin-aware
```

### Implementation tasks

- [x] Add `packages/templates/` — project template for `component-starter`, generate template functions
- [x] `wizard/discover.ts` — scan `node_modules` for `stencil.wizard` field
- [x] `task-generate.ts` — replace `prompts` with `@clack/prompts`, use discovered plugin templates
- [x] `task-init.ts` — new project wizard (`@stencil/templates`, `nypm`, `std-env`)
- [x] `task-init.ts` — existing project mode (install new + configure existing integrations)
- [x] `wizard/splash.ts` — ASCII logo, TTY/NO_COLOR aware
- [x] `packages/cli/test/` — e2e tests with real temp dir + fixture wizard plugin
- [x] **Redesign `WizardInitContribution`** — replace static `configPatch`/`devDependencies` with `run(context: WizardContext) => Promise<void>`
- [x] **Update `task-init.ts`** — call `plugin.init.run(context)` instead of `applyConfigPatches`
- [x] **Remove `applyConfigPatches`** from `wizard/init/apply.ts` — no longer called by CLI; plugins use Node fs APIs directly
- [x] **Update unit tests** — mock `run()` instead of `configPatch`; assert it was called with correct context
- [x] **Update e2e fixture** — replace `configPatch.imports` with a real `run()` that writes to stencil.config.ts
- [x] **`STENCIL_WIZARD_DEV` escape hatch** — `STENCIL_WIZARD_DEV=./path/to/wizard.js stencil init` injects a local wizard file into discovery without needing it in `node_modules`; dev-mode banner shown in CLI output
- [ ] Retire `create-stencil` active development, publish permanent shim

---

## @stencil/unplugin — Universal Bundler Plugin

Package at `packages/unplugin/`. 32 tests (8 browser via `pnpm test:browser`).

### Design
- `componentExport: 'customelement'` — component self-registers on import
- `styleImportData: 'queryparams'` — CSS imports carry `?tag=my-cmp&encapsulation=shadow`
- **JSX detection**: reads `tsconfig.json` for `jsx`/`jsxImportSource`; falls back to detecting `h` import → classic `jsx:react`; otherwise `jsx:react-jsx` + `jsxImportSource:@stencil/core`
- **Filter**: `/\.tsx?$/` + fast `@Component` decorator check before paying `transpileSync` cost
- **`enforce: 'pre'`** on Vite plugin so our transform runs before rolldown's built-in TSX handling

### CSS pipeline
- **Vite**: `resolveId` rewrites `./foo.css?tag=...` → `/abs/foo.css?inline&__stencil_tag=...&__stencil_enc=...`; Vite's own CSS pipeline (PostCSS/SCSS/lightningcss) runs; Stencil never touches it
- **Non-Vite**: `resolveId` → `\0stencil-css:/abs/foo?tag=...&__ext=css` (dotless ext avoids `CSS_LANGS_RE` match); `load` reads raw CSS, applies `scopeCss` if scoped, returns `export default JSON.stringify(css)`. Users configure their CSS plugin to output strings (rollup-plugin-postcss `inject:false`)
- `scopeCss` + `getScopeId` are now exported from `@stencil/core/compiler`

### Base class inheritance (virtual module registry)

Devs never manually extend `HTMLElement` — Stencil must inject it automatically, including for base classes that derived Stencil components extend.

**Architecture:**
1. `makeResolver` in `transform.ts` calls an `onBaseClass?(absPath, rawCode)` callback for every file resolved via `resolveImport`.
2. `registerBaseClass` in `plugin.ts` caches each file via `transpileBaseClass(rawCode, absPath, { transformAsBaseClass: true })`.
3. `resolveId` redirects imports of registered base classes to `\0stencil-base:<absPath>` virtual modules.
4. `load` serves the cached injected code + `addWatchFile` for HMR.

**Ordering:** `resolveId` for imports in transformed output fires *after* the `transform` hook — registry is already populated.

**Two patterns handled:**
- Classes with Stencil decorators (`@Prop`/`@State` etc.) → detected by `isStencilBaseClass` check
- Plain classes (only lifecycle hooks, no decorators) → `transformAsBaseClass: true` flag forces `updateNativeBaseClass`

**Core compiler additions:**
- `TranspileOptions.transformAsBaseClass?: boolean` — new field passed through to `TransformOptions` and `nativeComponentTransform`
- `updateNativeBaseClass()` in `native-component.ts` — adds `extends HTMLElement`, strips meta getters, injects `super()`, **preserves `export`** (unlike `updateNativeExtendedClass` which strips it in customelement mode)

### HMR
- **Vite**: `handleHotUpdate` sends `stencil:hmr` WS event; client calls `el['s-hmr'](version)` → `hmrStandalone` re-imports + patches
- **webpack/rspack**: `module.hot || import.meta.webpackHot` + dispose/accept/data re-execution
- **bun**: `import.meta.hot` + dispose/accept/data
- `defineCustomElement` guards `customElements.define` with `customElements.get()` check for HMR re-import safety
- Base class HMR: `addWatchFile(realPath)` in virtual module `load` hook → bundler invalidates on source change

### Open / next tasks
- [ ] Scoped CSS post-transform for Vite: needs a separate `enforce:'post'` plugin (putting it in `vite:{transform}` overwrites unplugin's main transform via `Object.assign`)
- [ ] CSS HMR: when a `.css` file changes, trigger component re-render (currently only `.tsx` HMR is wired)
- [ ] Storybook migration target (replace `@stencil/react-output-target` + Storybook webpack plugin)
- [ ] Test fixture for plain lifecycle-only base class (no decorators) to cover `transformAsBaseClass` path end-to-end
- [ ] README / docs

---

## Architecture Reference

```
packages/
├── core/        @stencil/core (compiler + runtime)
├── cli/         @stencil/cli
├── templates/   @stencil/templates (project + generate templates, versioned lockstep)
├── mock-doc/    @stencil/mock-doc
├── unplugin/    @stencil/unplugin (universal bundler plugin — Vite/Rollup/webpack/rspack/bun)
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

## ⚡ Signals - "make default" consideration
- [ ] Evaluate adoption/feedback
- [ ] If stable and popular: flip `signalBacking` default to `true`, deprecate old Map path, remove in next major

---

## Build Commands

```bash
pnpm run build     # Build all packages
pnpm run dev       # Watch mode
```

---

*Last updated: 2026-06-25*
