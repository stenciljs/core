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

---

## Tasks

### 🚀 Zero-Config DX (In Progress)

Stencil is now 90%+ design systems, not apps. The DX should reflect that — `npx stencil build --dev --serve` in a directory with some `.tsx` files should just work.

**Key decisions:**
- No `stencil.config.ts` required — the compiler already handles a missing config gracefully (`loadConfig` has a "which is fine" path)
- Default output is `loader-bundle`, not `www` — reflects the design system use case
- Namespace derives from `package.json#name` (scope-stripped) → directory name → `'App'` as last resort
- `validateDistNamespace` removed — derivation makes the "don't use App" guard unnecessary

**What's done:**
- [x] Default output changed from `www` to `loader-bundle` (`outputs/index.ts`)
- [x] `validate-www.ts` no longer handles defaulting — only validates explicit `www` outputs
- [x] Namespace auto-derived from `package.json` / directory name (`validate-namespace.ts`)
- [x] `validateDistNamespace` removed
- [x] `src/global.{css,scss,sass}` auto-detected → `config.globalStyle` if not set
- [x] `src/global.{ts,js}` auto-detected → `config.globalScript` if not set

**What's next:**

#### ~~Auto-generate `tsconfig.json`~~ ✅
- The mechanism already existed behind an `initTsConfig` flag that was never activated
- Removed the flag — tsconfig is now always auto-written when missing (`typescript-config.ts`)
- Updated template for v5: `moduleResolution: bundler`, `lib: [dom, ES2017]`, `strict: true`, dropped `sourceMap`/`inlineSources` (Stencil overrides at runtime)
- Target version check now uses `< ES2017` comparison instead of deprecated `ES3`/`ES5` enum values

#### ~~Dev server: no `index.html` required~~ ✅
Default behaviour for any project **without a `www` output** (no-config or explicit config using `loader-bundle`/`standalone`):

- `/` → redirects to `/src/` if it exists, otherwise shows dir listing
- **Dir has `.tsx` files + no `.html` files** → per-directory component preview (only components from that dir), with loader `<script>` and global CSS `<link>`
- **Dir has an `.html` file** → dir listing as usual (user can click through to their own page)
- `www` projects are unaffected — their server root is `www.appDir`, not the project root

This is filesystem-driven with no config gating — any non-www project benefits automatically.

---

### 🌍 `ssr-wasm` Output Target (Planned)

New output target that compiles the SSR script to a standalone `.wasm` binary, callable from any language with a WASM runtime (PHP via `ext-wasm`, Java via `wasmtime-java`, Ruby via `wasmtime-rb`, Go, Rust, etc.).

**Key design decisions:**
- Strip `streamToString()` and all `node:stream` usage entirely  not needed
- Expose a single `renderToString(html: string, options?: string): string` interface
- Toolchain: [javy](https://github.com/bytecodealliance/javy) (Shopify, bytecodealliance) compiles the bundled SSR JS → WASM via QuickJS; [Extism PDK](https://extism.org/) as an optional layer for cleaner host function call interface
- Interface convention: stdin/stdout (javy default) or Extism plugin exports  TBD based on what host runtimes support best
- No JS runtime required on the backend  any WASM-capable host can SSR a component document

**What needs to happen:**
- [ ] Add `ssr-wasm` output target type and validation
- [ ] Build step: after normal SSR bundle is generated, run javy to produce `index.wasm`
- [ ] Ensure SSR bundle has zero Node built-in deps before handing to javy
- [ ] Evaluate Extism vs raw javy stdin/stdout for the host call interface
- [ ] Document usage examples for PHP, Java, Rails, Go

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
    # No test templates — those live in @stencil/vitest / @stencil/playwright
```

**No template engine needed for project templates** — they are mostly static files, simple `str.replace()` for project name interpolation (same approach as `create-vite`, `create-next-app`). Generate templates are TypeScript functions (as they are today), just moved here.

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
export const wizard: StencilWizardPlugin = {
  // Contributes to `stencil generate` — provides spec file template
  generate: {
    specTemplate: (tagName: string, className: string) => `...vitest boilerplate...`,
  },
  // Contributes to `stencil init` — declares what it installs/configures
  init: {
    id: 'vitest',
    displayName: 'Vitest',
    description: 'Unit + component testing',
    devDependencies: ['@stencil/vitest', 'vitest'],
    configPatch: {
      imports: [`import { defineConfig } from 'vitest/config'`],
    },
  },
}
```

**Discovery:** at wizard runtime, the CLI scans installed packages for the `stencil.wizard` field and dynamically imports matching modules. No central registry. Whatever is installed participates.

**Impact on `stencil generate`:**
- `@stencil/vitest` installed → offer spec file, use its template
- `@stencil/playwright` installed → offer e2e file, use its template
- Neither installed → no test file options (or inline hint to install one)
- `@stencil/sass` installed → offer `sass`/`scss` style extensions, default to `scss`

This replaces the current hardcoded `if (plugin.name === 'sass')` checks in `task-generate.ts`.

### Dependency changes

| Remove | Add |
|--------|-----|
| `prompts` | `@clack/prompts` |
| custom download/unzip in `create-stencil` | `giget` |
| `yauzl`, `node-fetch` (in create-stencil) | — |
| — | `nypm` (package manager detection + install) |
| — | `std-env` (CI/TTY detection — skip wizard in CI) |

### `stencil init` discovery — two-phase approach

`discoverPlugins` only finds packages that are *already installed*, which means a fresh project (nothing installed yet) gets no options. `task-init.ts` solves this with a two-phase flow:

1. **Well-known list baked into the CLI** — just names + display info, no behavior:
   ```ts
   const KNOWN_INTEGRATIONS = [
     { package: '@stencil/vitest',     displayName: 'Vitest',     description: 'Unit testing' },
     { package: '@stencil/playwright', displayName: 'Playwright', description: 'E2E testing' },
     { package: '@stencil/sass',       displayName: 'Sass',       description: 'Sass/SCSS styles' },
   ];
   ```
   User picks from this list. CLI installs the selected packages via `nypm`.

2. **Re-discover after install** — `discoverPlugins` runs again; installed modules provide all actual behavior (`configPatch`, `fileTemplates`, etc.). No behavior is hard-coded in the CLI.

**Key property:** the CLI only knows *what exists and what to call it* — not *what it does*. All wizard behavior stays in the packages. A `@stencil/vitest` config-patch change is a `@stencil/vitest` release, not a CLI release. Community packages work identically — they just don't appear in the well-known list (users reach them via `--template` or manual install).

**Type implication:** `WizardInitContribution` is the shape a *plugin* exports. A companion `KnownIntegration` type (just `package` + display info) will live in `task-init.ts` for the CLI-side list — keeping the two concerns separate.

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
- [x] Define `StencilWizardPlugin` interface in `@stencil/cli` (public, exported)
- [x] `wizard/discover.ts` — scan `node_modules` for `stencil.wizard` field
- [x] `task-generate.ts` — replace `prompts` with `@clack/prompts`, use discovered plugin templates
- [ ] `task-init.ts` — full project wizard (template selection via `@stencil/templates`, deps via `nypm`, CI detection via `std-env`)
- [ ] `task-init.ts` — existing project mode (add output targets, styling, testing integrations)
- [ ] Add `giget` for custom template URL support (`--template github:org/repo`)
- [ ] Retire `create-stencil` active development, publish permanent shim
- [ ] Update `@stencil/vitest` to export `stencil.wizard` with `fileTemplates` (spec test entry)
- [ ] Update `@stencil/playwright` to export `stencil.wizard` with `fileTemplates` (e2e test entry)
- [x] Add `stencil init` to `TaskCommand` type and `runTask` switch
- [x] `wizard/splash.ts` — ASCII logo with halftone ANSI coloring (dim for `.:- *`, bold for `@%`), TTY/NO_COLOR aware
- [x] `task-init.ts` — stub wired up, shows splash, intercepts before `findConfig`

---

## Architecture Reference

```
packages/
├── core/        @stencil/core (compiler + runtime)
├── cli/         @stencil/cli
├── templates/   @stencil/templates (project + generate templates, versioned lockstep)
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

*Last updated: 2026-05-23*
