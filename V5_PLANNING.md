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

## ⚡ Signals - "make default" consideration
- [ ] Evaluate adoption/feedback
- [ ] If stable and popular: flip `signalBacking` default to `true`, deprecate old Map path, remove in next major

---

## ⚡ SSR / Hydration Performance (Planned)

Hydration on a normal-sized page with multiple components can block the JS main thread for seconds. Several independent improvements, ordered easiest → hardest. Each should be tested and merged independently.

---

### 1. 🌳 TreeWalker traversal (Easy — pure refactor)

**Problem:** Both `initializeDocumentHydrate` and `clientHydrate` use recursive JS traversal.  
**Fix:** Replace with `document.createTreeWalker()` — C++ native, 2–5× faster than JS recursion on deep trees. Filter callback lets us skip subtrees with no Stencil attributes.  
**Scope:** `client-hydrate.ts` only. No API changes, no feature flags.

---

### 2. 📦 Serialize `orgLocNodes` map as JSON (Medium)

**Problem:** `initializeDocumentHydrate` does a full recursive walk of `document.body` on every page load purely to build `plt.$orgLocNodes$` — a map of component host IDs and original-location comment anchors. This data is entirely knowable at SSR time.

**Fix:** During SSR, emit the org-loc data as a JSON blob (e.g. `<script type="application/json" id="stencil-ol">{...}</script>`). On the client, if the script tag is present, parse it and populate `plt.$orgLocNodes$` directly — skipping `initializeDocumentHydrate` entirely.

**What needs to be serialized:**
- Component host IDs (to populate the `id → element` half of the map): the client can resolve these via `querySelectorAll('[s-id]')` — fast, browser-indexed, no tree walk needed.
- Original-location anchors (the `o.hostId.nodeId` comment nodes): comments can't be CSS-queried, so the JSON needs enough positional info to find them without a full walk (e.g. a targeted `TreeWalker(SHOW_COMMENT)` filtered to only visit nodes near known host elements, rather than the full document).

**Fallback:** if the script tag is absent (non-SSR page, or older SSR output), fall back to the existing `initializeDocumentHydrate` walk as today.

**Scope:** SSR annotation output + `client-hydrate.ts` + `connected-callback.ts`.

---

### 3. 🧱 `ssr.reHydrate: 'none'` — Truly static components (Medium)

A `@Component` decorator option for purely presentational components (headers, footers, decorative wrappers) that never need client-side rendering or reactivity.

```ts
@Component({
  tag: 'my-footer',
  encapsulation: { type: 'shadow' },
  ssr: {
    reHydrate: 'none',     // skip SSR annotations + skip client init entirely
  }
})
```

**Semantics:** The SSR'd HTML is authoritative and stays frozen. `connectedCallback` bails out immediately after ensuring `initializeDocumentHydrate` has run (needed for child CE hydration). `initializeComponent` never runs. No VDOM, no lifecycle, no `@State`/`@Listen`/`@Watch`.

**Constraints:**
- **Shadow components:** always allowed. `reHydrate: 'none'` implies `ssr.shadowRender: 'dsd'` — DSD bakes shadow DOM into HTML; native `<slot>` handles projection, no `o.` annotations needed.
- **Non-shadow / scoped components:** allowed only when static analysis confirms no real internal DOM. The compiler checks at build time:
  - ✅ No `render()` method — pure attribute/class-driven host, nothing to manage
  - ✅ `render()` returns only `<Host>` with `<slot />` children (default or named) and no other element children — pass-through wrapper, nothing relocates
  - ❌ `render()` has real internal element children (`<div>`, etc.) — compiler **error**: `dom-extras` shielding and scoped CSS application require `initializeComponent` to run
- Compiler **warning** if `@State`, `@Listen`, `@Event`, or `@Watch` are present on a `reHydrate: 'none'` component — they silently do nothing.
- **Without SSR:** `reHydrate: 'none'` has no meaning (there's no SSR'd HTML to preserve). Flag is ignored and component boots normally. This is why the option lives under `ssr.*` not top-level.

**Dynamic islands:** Child CEs inside a static parent hydrate independently — each has its own `s-id` and runs its own `connectedCallback`. The static parent still triggers `initializeDocumentHydrate` (the one-time full-doc scan) before bailing, so child CEs have everything they need.

**SSR changes (`vdom-annotations.ts`):** Skip emitting `s-id` on the host element and skip emitting **all** Stencil comment nodes for its subtree — hydration annotations (`<!--c.-->`, `<!--t.-->`) AND slot polyfill comments (`<!--s.-->`, `<!--o.-->`, `<!--r.-->`). Slot content renders as direct children with no comment anchors. Clean HTML; no unexpected nodes for 3rd-party framework hydration (React, Vue, etc). Continue recursing into children — child CE annotations are emitted normally.

**Client changes (`connected-callback.ts`):** Check `CMP_FLAGS.noClientHydrate`. If set: run `initializeDocumentHydrate` if `plt.$orgLocNodes$` is unset, then `return` — skip `initializeClientHydrate` and `initializeComponent` entirely.

**`ssr` object rationale:** This is the first of several SSR-specific options. Others (e.g. `ssr.shadowRender: 'dsd' | 'scoped'`) belong here too. Keeps all SSR behaviour co-located and discoverable.

---

### 3. ⏳ `hydrateOn` — Deferred client hydration (Medium-Hard)

A top-level `@Component` decorator option controlling *when* hydration is triggered client-side (orthogonal to `ssr.*`).

```ts
@Component({
  tag: 'my-card',
  hydrateOn: 'connected',    // default — current behaviour
  // or:
  hydrateOn: 'intersection', // IntersectionObserver — hydrate when visible
  hydrateOn: 'idle',         // requestIdleCallback — hydrate when browser is idle
})
```

**`'intersection'`:** Set up an `IntersectionObserver` in `connectedCallback` instead of running `initializeComponent`. Fire hydration when the element enters the viewport. Default `rootMargin: '200px 0px'` to avoid visible pop-in — should be configurable.

**`'idle'`:** Use `requestIdleCallback` (or `setTimeout(0)` fallback) to defer hydration until the browser has free time. Simpler than IO, useful for below-fold non-critical interactive components.

**Key concerns:**
- **Prop queuing during deferral window.** Props set between connect and hydration fire must be queued and applied when hydration runs. The `s-pp` pending props map partially handles this; needs audit.
- **`@Listen` / host event listeners** are not wired until `initializeComponent` runs. During the deferral window, these silently swallow events. Needs documentation; may need a queuing mechanism for critical events.
- **Already-in-viewport case.** If the element is already visible when `connectedCallback` fires, skip the IO and hydrate immediately.
- **Disconnect before hydration fires.** If the element disconnects before the IO/idle callback fires, cancel and clean up.
- SSR annotations are still needed (the component will fully hydrate eventually), so `reHydrate: 'none'` + `hydrateOn` is a nonsensical combination — compiler warning.

---

### 4. 🔭 Single-pass document pre-scan (Hard)

**Problem:** `initializeDocumentHydrate` does one full doc walk to build `orgLocNodes`. Then each of N components does its own `clientHydrate` recursive subtree walk. Total DOM visits ≈ O(N × avg subtree depth).

**Fix:** Extend the single doc walk to build *complete* per-component VNode structures and slotting maps for all components at once. `initializeClientHydrate` becomes a O(1) lookup + apply — no per-component subtree traversal.

**Complexity:** Touches the core hydration algorithm. High risk of subtle regressions. Should be gated behind a build flag initially and heavily tested before enabling by default.

---

### Implementation order

| # | Feature | Difficulty | Files touched |
|---|---------|-----------|---------------|
| 1 | TreeWalker traversal | Easy | `client-hydrate.ts` |
| 2 | Serialize `orgLocNodes` as JSON | Medium | SSR annotation output, `client-hydrate.ts`, `connected-callback.ts` |
| 3 | `ssr.reHydrate: 'none'` | Medium | `connected-callback.ts`, `vdom-annotations.ts`, `constants.ts`, decorator types, build conditionals |
| 4 | `hydrateOn: 'intersection'` | Medium-Hard | `connected-callback.ts`, decorator types, build conditionals |
| 5 | `hydrateOn: 'idle'` | Medium | Same as above, simpler |
| 6 | Single-pass pre-scan | Hard | `client-hydrate.ts`, `connected-callback.ts` |

---

## Build Commands

```bash
pnpm run build     # Build all packages
pnpm run dev       # Watch mode
```

---

*Last updated: 2026-05-29*
