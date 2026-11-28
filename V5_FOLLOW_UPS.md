# v5 Follow-ups

Open work left over from v5. User-facing changes are recorded in [BREAKING_CHANGES.md](BREAKING_CHANGES.md) and the docs site; this file is only for what's still to do. Delete items when done.

## Decisions needed

- **SSR child waiting on a parent that's never defined.** With `hydrateClientSide`, a child queues its first render on the nearest un-upgraded SSR ancestor (`runtime/connected-callback.ts`). If that ancestor is never defined, the child's render, `connectedCallback` and `componentOnReady` never run. Options: accept it (the autoloader behaves this way already), `customElements.whenDefined()` + timeout, or an opt-out.
- **Mixed Stencil runtimes.** A host upgraded by a runtime whose `registerHost` overwrites `s-p`/`s-rc` would drop a queued child render. Decide whether older runtimes matter.
- **`signalBacking` default.** Flip to `true` once there's adoption feedback.
- **`hasElement` / `BUILD.element`.** `hasElement` is never set and nothing in the runtime reads `BUILD.element`. Remove both?
- **Stricter CSS parsing.** lightningcss rejects invalid CSS that v4 passed through (e.g. `::slotted(a, b)`, `@supports not selector(a) and selector(b)` in ionicons' `node_modules` CSS). Document as breaking, or warn and pass the rule through unchanged.
- **Real `<slot>` elements for non-shadow components (#6726, closed).** Simplifies the slot polyfill, but its fallback CSS needs `:has()` (Chrome/Edge 105, Firefox 121), above v5's Chrome/Edge 94 / Firefox 93 floor; also changes every SSR / spec snapshot. Separate piece of work if revived.

## Clean-up

- `CompilerSystem` remote-module leftovers: `getRemoteModuleUrl`, `compiler/sys/fetch/*`, `isRemoteUrl` branches in `core-resolve-plugin.ts`, `stencil-sys.ts`, `typescript-sys.ts`. The browser build is only the single-file transpiler (`compiler/browser.ts`), which doesn't fetch modules.
- `lazyRequire` only covers `workbox-build` now; replace with a plain dynamic import.
- `src/utils/index.ts` barrel (~280 importers). Not currently leaking into runtime/server bundles, but direct imports would stop that regressing.
- `*.sys.` patterns in ~40 files: assess whether moving to TypeScript incremental APIs is still worth it.
- `test-perf-ssr.yml` pins `runs-on: ubuntu-24.04` because CodSpeed's runner (action v5.0.3) rejects Ubuntu 26.04. Drop the pin when bumping the action to a release that supports 26.04 (v5.8.0+ looks likely; unconfirmed).

## Features

- Watch-mode fast path: reuse the watch `Program` in `transpileModule`; full rebuild only when component API changes, docs-only regen for JSDoc changes, module hot-swap otherwise.
- CSS-only components: warn when `@component` is inside `@media`/`@supports`/`@container` (currently skipped silently); no compile-time equivalent of `setTagTransformer()`.
- Vue/Angular output targets: wrap complex props in `ssrProp()` in generated wrappers.
- unplugin: confirm a component `.css` edit hot-updates the component under each bundler (Vite's `handleHotUpdate` only refreshes docs for `.css`).
- `create-stencil`: publish the shim that runs `npx @stencil/cli@latest init` (npm `latest` is still 4.0.2).
- `@stencil/storybook-plugin` (separate repo): show CEM `tags` in the docs panel; tests for `parseLiteralValues()` / `inferSBType()` / `inferControlType()`; migration guide from the community plugin.
- Build chain: tsgo.
- SSR primitives so islands / streaming can be built by meta-framework integrations or third parties: hydration ids per render (fragment renders share one process-wide counter, so parallel renders collide); per-element hydration deferral (the community `defer-hydration` attribute); a `streamToString` that actually streams (`server/runner/render.ts` renders the whole page, then enqueues it once) and fragment results that list the components and styles used; check whether the dev client still hydrates scoped pages blank (it adds a `<style>` to the shadow root before hydrating, so the server's nodes aren't moved in).
- SSR render cost left after `test/perf/ssr-benchmark`'s fixes: per-document nwsapi instances re-parse every selector (`closest()` per component); the platform is re-evaluated per full-document render. Its CodSpeed job (`test-perf-ssr.yml`, "SSR Performance" label) hasn't had a CI run yet.
- SSR peak memory vs Stencil 4 (reported for Ionic: ~445 MB vs ~279 MB) doesn't reproduce on `test/perf/ssr-benchmark` built with both (v4.45.3 390-404 MB, v5 363-370 MB peak RSS, same Node). Peak RSS there is V8 heap sizing, not retention: live heap after GC is ~10-16 MB. Confirming Ionic itself needs a v5 build of Ionic.
- `stencil build`: `detectMigrations` parses every source file with `ts.createSourceFile` before every build (~12% of a cold Ionic build). Add a cheap per-rule text check before parsing.
- `transpileSync` per file is ~15-25% slower than Stencil 4's. Profile.
- Windows (unverified): `appendGlobalScripts` (`bundle/app-data-plugin.ts`) imports the global script by its forward-slash path while components resolve it to the backslash path, so the module may be bundled twice (Ionic's mode reads `undefined`).
- `stencil migrate`: drop `experimentalScopedSlotChanges` from `compat`; handle tsconfig `baseUrl` (an error in TS 6).
- Init templates: `"stableTypeOrdering": true` (TS 7's only order; makes `docs.json` union order independent of check order).
- Inheritance: `Mixin` and parent classes are matched by their local name, so `import { Mixin as compose }` and `import { Base as B }` inherit nothing.
- SSR custom states: `:state(x)` can't match before hydration (no HTML serialization for custom states), so `:host(:state(open))` styles flash until the client runs `states.add()`. Serialize all active states (`initialValue` and any `states.add()` during server lifecycle hooks) to a host marker attribute (e.g. `data-state-open`) and have the compiler emit a fallback selector beside each `:state()` selector. Needs mock-doc `ElementInternals.states` to record adds (see #6960). Emit fallbacks as separate rules, not one selector list (an unsupported `:state()` drops the whole list). Remove the marker once the client applies states.

## Docs gaps (stencil-site)

- Hydrate app memory: Node's young generation grows to 128 MB under SSR load. `--max-semi-space-size=16` cut peak RSS ~47% on the SSR benchmark (median +6-12%, p95 -9-15%)
- Hydrate app: `module.enableCompileCache()` and a warm-up render before serving (cold first render 55 ms -> 10 ms on a small page)
- `config.modes`
- `docs-readme` `customColumns`
- `jsMinifier` (oxc default vs terser)
- unplugin `componentExport` and the per-bundler support matrix for `stencil-*` virtual CSS imports

## Tests

- `validatePublicName` (`compiler/transformers/reserved-public-members.ts`): no unit tests.
- `generate-types.ts` (`generateLoaderTypes`, `generateStandaloneApiTypes`): no tests that the `.d.ts` matches the JS entry's exports.
- Export maps: only `./custom-elements.json` / `./package.json` are resolved end to end (`test/build/docs-json`). Resolve `.`, `./loader`, `./standalone`, `./<tag>`, `./ssr` from a consumer.
- `ssr-wasm.e2e.ts`: `setTagTransformer` only checks the host tag; add a nested tag.
- Bundle size: `test/build/build-size/*` pin `jsMinifier: 'terser'`, so oxc output isn't budgeted. CodSpeed A/B of oxc vs terser not done.
- Granular `lightDomPatches`: `test/runtime` is a dev build, so every patch flag is on. Nothing covers a prod build with a single flag (e.g. `{ domMutations: true }` alone, which must also patch the `innerHTML` / `innerText` setters).

## Decided against

Kept so they aren't re-proposed without new information.

- Restoring host classes / `hydrated` after an external `className` write (#6994): native behavior, and re-adding would override intentional removals. Use `classList`, the React output-target wrappers, or `hydratedFlag: { selector: 'attribute' }`.
- Auto-reflecting props to attributes during SSR: primitives only, adds unreflected attributes that go stale, conflicts with `"false"`-is-truthy booleans.
- `transferProps` SSR option: top-level JSON only, not in `ssr-wasm`, a second path alongside `@PropSerialize`/`@AttrDeserialize`.
- `devalue` in core: components pick their format in `@PropSerialize`.
- Wrapping `render()` in `effect()` to track `.value` reads: a third reactivity channel; render-time writes trip cycle detection.
- Native decorators (dropping `experimentalDecorators`): churn with no payoff, Stencil transpiles regardless.
- Typed multi-token class lists via template-literal types: combinatorial unions, poor completion. Single-token `KnownClass | (string & {})` is the ceiling.

## Post-v5 ideas

- Source maps for the `ssr` / `ssr-wasm` targets (none today). Needs the factory build's map passed into the runner build, `postProcessSsrCode`'s string edits moved to a `renderChunk` hook, and the optional minify chained; add `ssr` to `test/build/sourcemaps` once done.
- Manifest/typing for styled native elements (`<button class="btn-primary">`, `<progress class="ring">`). Reuse CSS-only component discovery/parsing; relax the custom-element tag gates in `parse-css-component.ts`; needs a manifest shape (CEM hardcodes `customElement: true`). Typing via compiler-generated `JSXBase` augmentation using the `class` object-map form. Open: attributes, `data-*` only, or either with a lint nudge.
