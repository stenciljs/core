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
- **`@Component` now supports `globalStyleUrl` and `globalStyle`** — co-locate document-level styles with the component. Styles are collected at build time and injected wherever `@import "stencil-globals"` appears in a global stylesheet. Works for all encapsulation types (shadow, scoped, none). No mode variants — CSS handles runtime variants via selectors or custom properties. Changes to `globalStyleUrl` files invalidate the global style build cache and trigger HMR correctly.
- **`@import "stencil-hydrate"` virtual placeholder** — add to any `global-style` input to inject static FOUC-prevention CSS at build time instead of relying on the dynamic `<style>` tag inserted by the loader. The compiler replaces the placeholder with the sorted component selectors + configured hydration CSS (e.g. `my-cmp,other-cmp{visibility:hidden}.hydrated{visibility:inherit}`). When detected, `BUILD.staticHydrationStyles = true` suppresses the loader's dynamic injection. For `standalone` builds (which have no loader), `stencil-hydrate.css` is auto-generated alongside the bundle.
- **`loader-bundle` now supports `externalRuntime`** — set `externalRuntime: true` on the `loader-bundle` output target to mark `@stencil/core` as an external dependency in the ESM/CJS distribution output. Only affects the bundler variant; the browser/CDN build always includes the runtime. Useful when consumers already depend on `@stencil/core` and want to avoid bundling a second copy.

---

## Tasks

### 🌍 `ssr-wasm` Output Target (Planned)

New output target that compiles the SSR script to a standalone `.wasm` binary, callable from any language with a WASM runtime (PHP via `ext-wasm`, Java via `wasmtime-java`, Ruby via `wasmtime-rb`, Go, Rust, etc.).

**Key design decisions:**
- Strip `streamToString()` and all `node:stream` usage entirely — not needed
- Expose a single `renderToString(html: string, options?: string): string` interface
- Toolchain: [javy](https://github.com/bytecodealliance/javy) (Shopify, bytecodealliance) compiles the bundled SSR JS → WASM via QuickJS; [Extism PDK](https://extism.org/) as an optional layer for cleaner host function call interface
- Interface convention: stdin/stdout (javy default) or Extism plugin exports — TBD based on what host runtimes support best
- No JS runtime required on the backend — any WASM-capable host can SSR a component document

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

---

## ⚡ Signals Integration (In Progress)

### Vision

Replace `@State`/`@Prop` internals with signals via a single opt-in config flag — zero API changes for component authors, cleaner reactivity, cross-framework interop. If it proves popular, make it the default in a later release.

### Approach

Global `extras.signalBacking: true` flag in `stencil.config.ts`. Controls a `BUILD.signalBacking` compile-time constant that tree-shakes the entire signal code path in or out. No per-component or per-decorator changes needed.

```typescript
// stencil.config.ts
export const config: Config = {
  extras: {
    signalBacking: true  // opt-in
  }
};

// Components unchanged — @State and @Prop work identically
@Component({ tag: 'my-counter' })
export class MyCounter {
  @State() count = 0;
  render() { return <div>{this.count}</div>; }
}
```

### Why not per-decorator opt-in?

- **Runtime bytes:** global flag means one code path (signal OR Map), tree-shaken cleanly. Per-decorator would ship both paths in every bundle.
- **Hot path performance:** no per-member flag check on every getter/setter call.
- **Simpler implementation:** no `MEMBER_FLAGS.SignalBacked` in compiler metadata, no branching in proxy internals.
- **Simpler user model:** "my app uses signals" is a project-level decision.

### Signal library

`@preact/signals-core` — production-stable, ~1.3kb, zero deps, convergent with TC39. Abstracted behind `packages/core/src/runtime/signals.ts` so it can be swapped if TC39 finalizes.

### Why bother over `@Watch`?

`@Watch` covers derived state within a component. Signal-backing adds:

1. **Cross-framework interop** — Stencil component state becomes subscribable by Solid/Angular/Preact reactive systems natively, no event/attribute roundtrip.
2. **Computed derivations** — lazy, auto-dep-tracked, composable. No intermediate `@State` + watcher boilerplate.
3. **Path to JSX leaf bypass** — signal objects in JSX can skip the vdom diff and update DOM nodes directly (Phase 2).

### Phases

#### Phase 1 — Signal-backed `@State` and `@Prop`
- [x] Add `@preact/signals-core` to `packages/core`
- [x] Create `packages/core/src/runtime/signals.ts` — adapter (`signal`, `computed`, `effect`, `batch`, `untracked`) + `initializeSignals`
- [x] Add `signalBacking?: boolean` to `extras` config type (`ConfigExtrasBase`)
- [x] Add `BUILD.signalBacking` constant + wire from `updateBuildConditionals` + `COLLECTION_CONFIG_FLAGS`
- [x] `$signalValues$` + `$signalCleanup$` added to `HostRef`; `signalBacking` added to `BuildConditionals`
- [x] **`set-value.ts`:** signal fast-path in `getValue` + `setValue` — bypasses Map once signals are initialized
- [x] **`initialize-component.ts`:** calls `initializeSignals` before first `scheduleUpdate` — allocates one `Signal.State` per `@Prop`/`@State` member, seeded from `$instanceValues$`
- [x] **Scheduling:** per-prop `effect()` calls `scheduleUpdate()` on change (first run is no-op — `hasRendered` guard)
- [x] **Watchers:** per-prop `effect()` fires `@Watch` callbacks with old/new value
- [x] **`componentShouldUpdate`:** called from within the scheduling effect, can still veto
- [x] **`@Prop` attribute path:** works via existing `attributeChangedCallback` → proxy setter → `setValue` signal fast-path
- [x] **Disconnect cleanup:** `disconnected-callback.ts` calls `$signalCleanup$()` and nulls it on real disconnects (skipped for temporary slot relocations)
- [x] **`reflect: true` with custom serializers:** serializer now runs inside the signal fast-path before `sig.value` is set, populating `$serializerValues$` before the triggered re-render
- [x] Tests — unit (`signals.spec.ts`) + integration (`signal-backing.spec.tsx`)

#### Phase 2 — `@stencil/core/signals` subpath ✅ Complete
- [x] New `packages/core/src/signals/index.ts` — public entry for signal primitives + decorators
- [x] Re-exports `signal`, `computed`, `effect`, `batch`, `untracked`, `Signal`, `ReadonlySignal` from `@preact/signals-core` (bundled, no extra install)
- [x] `@Effect()` — pure runtime TS decorator; marks a method as a reactive effect, auto-tracked deps, auto-cleaned up on disconnect. Requires `signalBacking: true` (wired in `initializeSignals`)
- ~~`@Computed()` decorator~~ — **removed**. Adds no value over `computed()` as a class field, and the return-type change (`ReadonlySignal<T>` vs `T`) created a typing nightmare for users.
- [ ] `@Effect()` without `signalBacking` — currently requires `signalBacking: true`; wiring could be moved to `initialize-component.ts` to support external-signal-only use cases

#### Phase 3 — JSX vdom bypass ✅ Complete
- [x] `BUILD.vdomSignals` flag — auto-enabled by `signalBacking: true`; also standalone via `extras.vdomSignals: true`
- [x] `<Show when={signal}>` — signal-conditional rendering via `<s-show>` wrapper with `display:contents`/`none` toggle. Children are part of the normal vdom tree so the existing diff handles updates.
- [x] Signal text children — `<div>{mySignal}</div>` → `effect()` updates `textNode.data` directly, bypasses vdom diff
- [x] Signal attribute values — `<div class={mySignal}>` → `effect()` calls `setAccessor` directly
- [x] Per-node cleanup: `WeakMap<Node, () => void>` (text nodes + Show wrappers) + `WeakMap<Node, Map<string, () => void>>` (per-attribute). `removeVnodes` recursively disposes.
- [x] `SignalRef<T>` interface in public runtime declarations — JSX type compatibility without importing `@preact/signals-core`
- [x] Tests — 12 tests across signal text children, signal attributes, `<Show>`

**Design decisions:**

- **Signal detection:** Duck-type via `typeof v.peek === 'function' && typeof v.subscribe === 'function'` rather than `instanceof Signal`. This is cross-bundle-safe — both the `signals/` bundle and the `runtime/` bundle inline `@preact/signals-core`; two separate class instances would make `instanceof` fail when signals are passed across bundle boundaries. At app build time bundlers deduplicate `@preact/signals-core`, so `instanceof` would also work, but duck-typing is the safer default.
- **`@Computed()` bypass:** Computed getter body runs inside `computed()`, so the vdom bypass works automatically — `this.doubled` returns the `ReadonlySignal` and JSX picks it up.
- **`<s-show>` wrapper:** A generic HTML element (`display:contents` when visible, `display:none` when hidden). `display:contents` removes the element from the layout box model — it is transparent to CSS layout. Children participate in normal vdom diffing via `updateChildren` on the wrapper.
- **SHOW_TAG sentinel:** `Symbol('s-show')` in `runtime-constants.ts`, used as `$tag$` on Show VNodes. `VNode.$tag$` type extended to `string | number | Function | symbol | null`.
- **`$signal$?: any` on VNode:** Stores the signal reference through the `h()` → `createElm()` pipeline for text nodes and Show VNodes.

#### Phase 4 — `<For>` reactive list rendering (deferred)

`<For each={signal<T[]>}>{(item: T, index: number) => VNode}</For>`

Deferred because it requires keyed array diffing scoped to a DOM anchor region — essentially a mini vdom reconciler. The anchor-based model (same as `<Show>`) applies, but the update path is significantly more complex:

- On signal change, diff old array vs new array by key
- For each changed item: patch existing DOM node in place
- For added items: create new DOM nodes and insert at the right position
- For removed items: dispose their signal subscriptions and remove from DOM

The fundamental challenge is that creating DOM nodes from VNodes requires the module-level render state (`hostTagName`, `scopeId`, `isSvgMode`) that is only valid during a `renderVdom` call. Either capture this context on first render and restore it during subscription callbacks, or schedule a `hostRef` re-render (which loses the "bypass" benefit for list additions/removals).

Start `<For>` only after `<Show>` has been shipped and tested. Revisit design at that point.

#### Later — make default
- [ ] Evaluate adoption/feedback from Phases 1 + 2
- [ ] If stable and popular: flip `signalBacking` default to `true`, deprecate old Map path, remove in next major

#### Out of scope for now
- Separate `@stencil/signals` store package — relegated; the `@stencil/core/signals` subpath covers the in-component use case

### Files Changed

| File | Change |
|------|--------|
| `packages/core/package.json` | Added `@preact/signals-core` dep; `./signals` subpath export |
| `packages/core/tsdown.config.ts` | Added `signals/index` entry |
| `packages/core/src/signals/index.ts` | New — public entry: signal primitives re-export + `@Effect()` + `@Computed()` |
| `packages/core/src/runtime/signals.ts` | `initializeSignals` — per-prop scheduling + watcher effects + `@Effect()` wiring |
| `packages/core/src/declarations/stencil-private.ts` | `$signalValues$`, `$signalCleanup$` on `HostRef`; `signalBacking` on `BuildConditionals` |
| `packages/core/src/declarations/stencil-public-compiler.ts` | `signalBacking` on `ConfigExtrasBase` |
| `packages/core/src/compiler/app-core/app-data.ts` | Set `BUILD.signalBacking` from config; added to `COLLECTION_CONFIG_FLAGS` |
| `packages/core/src/runtime/set-value.ts` | Signal fast-path in `getValue` + `setValue`; `applySerializers` helper (deduped); serializer fix |
| `packages/core/src/runtime/initialize-component.ts` | Calls `initializeSignals` before first `scheduleUpdate` |
| `packages/core/src/runtime/disconnected-callback.ts` | Calls `$signalCleanup$()` on real disconnect |
| `packages/core/src/runtime/_test_/signals.spec.ts` | Unit tests: `initializeSignals`, `@Effect()` wiring, decorator factories |
| `packages/core/src/runtime/_test_/signal-backing.spec.tsx` | Integration tests: `@State`, `@Prop`, `@Watch`, `@Effect()`, `computed()` class fields |
| `packages/core/src/runtime/runtime-constants.ts` | Added `SHOW_TAG = Symbol('s-show')` sentinel |
| `packages/core/src/runtime/vdom/h.ts` | Signal text children in `walk()`; guard class→string for signal values |
| `packages/core/src/runtime/vdom/set-accessor.ts` | Signal attribute subscriptions via `effect()`; `disposeAllSignalAttrs` |
| `packages/core/src/runtime/vdom/vdom-render.ts` | `createElm` signal text + Show handling; `disposeSignalVNode` on `removeVnodes` |
| `packages/core/src/declarations/stencil-public-runtime.ts` | `SignalRef<T>` interface; `class` attr type widened to accept `SignalRef<string>` |
| `packages/core/src/runtime/_test_/signal-vdom.spec.tsx` | New — 12 integration tests for Phase 3 vdom bypass |

### Out of scope (v6+ / future)

Fine-grained JSX compilation (Solid-style): JSX → direct DOM ops + effects, no vdom at all. Requires new compiler pass, new SSR strategy with reactive DOM markers, new hydration protocol. The right long-term direction but a separate multi-year effort.

---

## Build Commands

```bash
pnpm run build     # Build all packages
pnpm run dev       # Watch mode
```

---

*Last updated: 2026-05-20*
