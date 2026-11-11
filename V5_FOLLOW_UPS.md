# v5 Follow-ups

Open work left over from v5. User-facing changes are recorded in [BREAKING_CHANGES.md](BREAKING_CHANGES.md) and the docs site; this file is only for what's still to do. Delete items when done.

## Decisions needed

- **SSR child waiting on a parent that's never defined.** With `hydrateClientSide`, a child queues its first render on the nearest un-upgraded SSR ancestor (`runtime/connected-callback.ts`). If that ancestor is never defined, the child's render, `connectedCallback` and `componentOnReady` never run. Options: accept it (the autoloader behaves this way already), `customElements.whenDefined()` + timeout, or an opt-out.
- **Mixed Stencil runtimes.** A host upgraded by a runtime whose `registerHost` overwrites `s-p`/`s-rc` would drop a queued child render. Decide whether older runtimes matter.
- **`signalBacking` default.** Flip to `true` once there's adoption feedback.

## Clean-up

- `CompilerSystem` remote-module leftovers: `getRemoteModuleUrl`, `compiler/sys/fetch/*`, `isRemoteUrl` branches in `core-resolve-plugin.ts`, `stencil-sys.ts`, `typescript-sys.ts`. The browser build is only the single-file transpiler (`compiler/browser.ts`), which doesn't fetch modules.
- `lazyRequire` only covers `workbox-build` now; replace with a plain dynamic import.
- `src/utils/index.ts` barrel (~280 importers). Not currently leaking into runtime/server bundles, but direct imports would stop that regressing.
- `*.sys.` patterns in ~40 files: assess whether moving to TypeScript incremental APIs is still worth it.

## Features

- Watch-mode fast path: reuse the watch `Program` in `transpileModule`; full rebuild only when component API changes, docs-only regen for JSDoc changes, module hot-swap otherwise.
- CSS-only components: warn when `@component` is inside `@media`/`@supports`/`@container` (currently skipped silently); no compile-time equivalent of `setTagTransformer()`.
- Vue/Angular output targets: wrap complex props in `ssrProp()` in generated wrappers.
- unplugin: confirm a component `.css` edit hot-updates the component under each bundler (Vite's `handleHotUpdate` only refreshes docs for `.css`).
- `create-stencil`: publish the shim that runs `npx @stencil/cli@latest init` (npm `latest` is still 4.0.2).
- `@stencil/storybook-plugin` (separate repo): show CEM `tags` in the docs panel; tests for `parseLiteralValues()` / `inferSBType()` / `inferControlType()`; migration guide from the community plugin.
- Build chain: tsgo.
- `docs-json` `typeLibrary`: always use an alias's own text (`export type StringBox = Box<string>;`), not only when it resolves to a lib / package type (#6931). Today a project-type alias holds the target's declaration (generic, not instantiated) under the alias's id. Also add the types the alias references to the library, so the target's shape isn't lost. Changes `type-library-alias.spec.ts` and the `test/build/docs-json` fixture.
- SSR custom states: `:state(x)` can't match before hydration (no HTML serialization for custom states), so `:host(:state(open))` styles flash until the client runs `states.add()`. Serialize all active states (`initialValue` and any `states.add()` during server lifecycle hooks) to a host marker attribute (e.g. `data-state-open`) and have the compiler emit a fallback selector beside each `:state()` selector. Needs mock-doc `ElementInternals.states` to record adds (see #6960). Emit fallbacks as separate rules, not one selector list (an unsupported `:state()` drops the whole list). Remove the marker once the client applies states.

## Docs gaps (stencil-site)

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
