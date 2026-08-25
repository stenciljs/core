# Breaking Changes

This is a comprehensive list of the breaking changes introduced in the major version releases of Stencil.

## Versions

- [Stencil 5.x](#stencil-v500)
- [Stencil 4.x](#stencil-v400)
- [Stencil 3.x](#stencil-v300)
- [Stencil 2.x](#stencil-two)
- [Stencil 1.x](#stencil-one)

## Stencil v5.0.0

Stencil recently had its 10th birthday - this release is a consolidation, organization, and deprecation pass to pay down 10 years of technical debt. Most changes have an automatic migration path via `stencil migrate` (run `stencil migrate --dry-run` to preview changes before applying them).

- [General Changes](#general-changes)
  - [Integrated Testing Removed](#integrated-testing-removed)
  - [`@Component` API: `encapsulation` Replaces `shadow` / `scoped` / `formAssociated`](#component-api-encapsulation-replaces-shadow--scoped--formassociated)
  - [Stencil's Own Package Is Now Pure ESM](#stencils-own-package-is-now-pure-esm)
  - [`loader-bundle` and `ssr` No Longer Generate CommonJS by Default](#loader-bundle-and-ssr-no-longer-generate-commonjs-by-default)
  - [ES5 Builds & Legacy Polyfills Removed](#es5-builds--legacy-polyfills-removed)
  - [Internal Package Restructuring](#internal-package-restructuring)
  - [`openBrowser` Defaults to `false`](#openbrowser-defaults-to-false)
  - [`@Watch` Handlers No Longer Fire Before the Component Has Rendered](#watch-handlers-no-longer-fire-before-the-component-has-rendered)
  - [`componentShouldUpdate` Batching](#componentshouldupdate-batching)
  - [Rollup Replaced with Rolldown](#rollup-replaced-with-rolldown)
  - [JSX Types](#jsx-types)
  - [`extras` Renamed to `compat`](#extras-renamed-to-compat)
  - [Collection Importing / Re-bundling](#collection-importing--re-bundling)
- [Output Target Changes](#output-target-changes)
  - [Core Output Targets Renamed](#core-output-targets-renamed)
  - [`ssr` Output Target (formerly `dist-hydrate-script`)](#ssr-output-target-formerly-dist-hydrate-script)
  - [`standalone`: `externalRuntime` Defaults to `false`](#standalone-externalruntime-defaults-to-false)
  - [`www`: `serviceWorker` Defaults to `null`](#www-serviceworker-defaults-to-null)
  - [`hashFileNames` / `hashedFileNameLength` Moved to Output Targets](#hashfilenames--hashedfilenamelength-moved-to-output-targets)
  - [Global Styles & Assets Modernized](#global-styles--assets-modernized)
  - [Output File Extensions Modernized](#output-file-extensions-modernized)
- [Configuration](#configuration)
  - [`buildDist` and `buildDocs` Removed](#builddist-and-builddocs-removed)
  - [`--prod` Flag and `devMode` Config Removed](#--prod-flag-and-devmode-config-removed)
  - [Ambient Asset Imports Require a `?stencil` Suffix](#ambient-asset-imports-require-a-stencil-suffix)
  - [`docs-readme` No Longer Auto-Injected](#docs-readme-no-longer-auto-injected)
- [Compiler API](#compiler-api)
  - [`@stencil/core/compiler` No Longer Wildcard-Exports `stencil-private`](#stencilcorecompiler-no-longer-wildcard-exports-stencil-private)

### General Changes

#### Integrated Testing Removed

Stencil's integrated `--spec` (Jest) and `--e2e` (Puppeteer) testing has been removed, along with the `stencil test` CLI task. This coupling required Stencil to ship a custom Jest environment per major Jest version, reached into Stencil's internals to bootstrap components (which never fully supported `extends`/Mixin), and hard-baked e2e testing to Puppeteer.

To migrate:
- For `--spec`-style unit tests, use [`@stencil/vitest`](https://github.com/stenciljs/vitest). It has a similar API to the previous Jest integration, but lets you test against different bundles/outputs, test in a real browser (accessibility, visual regressions, etc.), and pick your own DOM implementation (e.g. happy-dom, JSDOM) instead of being locked to Stencil's `MockDoc`.
- For `--e2e`-style tests, many library authors actually want isolated *component* tests that happen to run in a browser - `@stencil/vitest` covers this too. For true end-to-end tests (routing, full applications, onload initialization, SSR), use [`@stencil/playwright`](https://github.com/stenciljs/playwright).

#### `@Component` API: `encapsulation` Replaces `shadow` / `scoped` / `formAssociated`

The `shadow`, `scoped`, and `formAssociated` properties on the `@Component()` decorator have been consolidated into a single `encapsulation` property:

```diff
@Component({
  tag: 'my-component',
- shadow: { delegatesFocus: true },
- formAssociated: true,
+ encapsulation: { type: 'shadow', delegatesFocus: true },
})
```

```ts
type Encapsulation =
  | {
      type: 'shadow';
      mode?: 'open' | 'closed';
      delegatesFocus?: boolean;
      slotAssignment?: 'manual' | 'named';
      clonable?: boolean;
      serializable?: boolean;
    }
  | { type: 'scoped'; patches?: ('all' | 'children' | 'clone' | 'insert')[] }
  | { type: 'none'; patches?: ('all' | 'children' | 'clone' | 'insert')[] };
```

- `shadow: true` → `encapsulation: { type: 'shadow' }`
- `scoped: true` → `encapsulation: { type: 'scoped' }`
- No encapsulation (default) → `encapsulation: { type: 'none' }` (the property may be omitted entirely - `'none'` is the default)
- `formAssociated: true` → use the `@AttachInternals()` decorator instead, which automatically sets `formAssociated: true`. To use `@AttachInternals` without form association, use `@AttachInternals({ formAssociated: false })`.
- **New:** `encapsulation: { type: 'shadow', mode: 'closed' }` enables closed shadow DOM.
- **New:** per-component slot patches via `encapsulation: { type: 'scoped', patches: [...] }` (previously only settable globally).
- **New:** `encapsulation: { type: 'shadow', clonable: true }` preserves the shadow root when the host is deep-cloned via `Node.cloneNode(true)` (without it, cloning a shadow host produces an empty shell).
- **New:** `encapsulation: { type: 'shadow', serializable: true }` marks the shadow root serializable, so it's included when the host is serialized via `Element.getHTML({ serializableShadowRoots: true })`.

Run `stencil migrate --dry-run` to preview the automatic migration, or `stencil migrate` to apply it. Running `stencil build` when there are pending migrations will raise a warning and invite you to run migrations before continuing.

#### Stencil's Own Package Is Now Pure ESM

Stencil's own internal source - the compiler, CLI, and dev server - has moved from CommonJS to ESM. Every subpath in `@stencil/core`'s `package.json` `exports` map now declares only an `import` condition, with no `require` fallback, so `require('@stencil/core/...')` fails to resolve regardless of Node.js version.

#### `loader-bundle` and `ssr` No Longer Generate CommonJS by Default

The `loader-bundle` and `ssr` output targets no longer generate CommonJS bundles by default - CJS output is now opt-in.

To migrate, add `cjs: true` to any `loader-bundle` or `ssr` output target that still needs CommonJS output:

```diff
outputTargets: [
  {
    type: 'loader-bundle',
+   cjs: true,
  },
]
```

#### ES5 Builds & Legacy Polyfills Removed

All ES5/SystemJS output and the associated legacy browser polyfills/shims have been removed. Stencil now targets ES2017+ only; IE11 and Edge 18 and below are no longer supported.

To migrate:
- Remove any imports of and calls to `applyPolyfills()` from your `loader-bundle` output.
- Remove the `buildEs5` config option from `stencil.config.ts`.
- Remove any of `extras.__deprecated__cssVarsShim`, `extras.__deprecated__dynamicImportShim`, `extras.__deprecated__safari10`, `extras.__deprecated__shadowDomShim` (already deprecated as of v4) from `stencil.config.ts`.

#### Internal Package Restructuring

A number of internal import paths have moved, either as part of the mono-repo restructure or the CJS-to-ESM migration:

- `@stencil/core/internal` → `@stencil/core/runtime`
- `@stencil/core/internal/client` → `@stencil/core/runtime/client`
- `@stencil/core/internal/hydrate` → `@stencil/core/runtime/server`
- `@stencil/core/cli` → `@stencil/cli`
- `@stencil/core/dev-server` → `@stencil/dev-server`
- `@stencil/core/mock-doc` → `@stencil/mock-doc`

#### `openBrowser` Defaults to `false`

The dev server no longer opens a browser tab automatically.

To migrate, if you relied on the previous auto-open behavior, pass `--open` on the CLI or set `openBrowser: true` in your `devServer` config. If you were previously passing `--no-open` to suppress this, it's no longer necessary and can be removed.

#### `@Watch` Handlers No Longer Fire Before the Component Has Rendered

Per [Stencil's documented lifecycle](https://stenciljs.com/docs/component-lifecycle#component-lifecycle-methods), `@Watch()` handlers should not fire until a component has fully rendered for the first time. Previously - especially in the `loader-bundle` output - watch methods could be called during earlier lifecycle stages. In v5, `@Watch` now adheres to the documented behavior. This is technically a bug fix, but the previous behavior was long-standing enough that some codebases may have come to rely on it.

To migrate, if you need a watcher to run before the component has finished rendering, call it manually from an earlier lifecycle method, or use `@Watch('propName', { immediate: true })`.

#### `componentShouldUpdate` Batching

`componentShouldUpdate` now fires once per render cycle instead of once per changed `@Prop`/`@State` member. The callback signature changed from `(newVal, oldVal, propName)` to a single `changes` argument - a map of every prop/state name that changed since the last render to its `{ newVal, oldVal }`:

```diff
- componentShouldUpdate(newVal, oldVal, propName) {
-   if (propName === 'prop1' && newVal === oldVal) {
-     return false;
-   }
- }
+ componentShouldUpdate(changes) {
+   if (changes['prop1'] && changes['prop1'].newVal === changes['prop1'].oldVal) {
+     return false;
+   }
+ }
```

For stricter per-prop typing, use the new `ComponentShouldUpdateChanges<this>` type:

```ts
componentShouldUpdate(changes: ComponentShouldUpdateChanges<this>) {
  if (changes['prop1']?.newVal === changes['prop1']?.oldVal) {
    return false;
  }
}
```

A compiler warning is now raised if `componentShouldUpdate` is declared with more than one parameter.

#### Rollup Replaced with Rolldown

Rollup has been replaced with [Rolldown](https://rolldown.rs/) as Stencil's bundler. Any `rollup*`-prefixed configuration in `stencil.config.ts` has been renamed to `rolldown*` (e.g. `rollupConfig` → `rolldownConfig`).

To migrate, run `stencil migrate` to rename these fields automatically. A number of previously supported Rollup options have no Rolldown equivalent and will be removed; others have new names and will be renamed. If you reference Rollup types or internals directly, check the [Rolldown documentation](https://rolldown.rs/) for the closest equivalent.

#### JSX Types

`JSX.Element` was previously left undefined in the `h` namespace, which caused TypeScript to silently fall back to `any` for JSX expressions (surfacing as `no-unsafe-return` errors under strict `@typescript-eslint` configs). Three related type-level changes:

| Type                  | Was                          | Now                  |
| ---------------------- | ----------------------------- | --------------------- |
| `h.JSX.Element`         | (undefined / fell back to `any`) | `VNode`             |
| `Host` / `Fragment`     | `FunctionalComponent<...>`    | `(props) => VNode`    |
| `FunctionalComponent`'s return type | `VNode \| VNode[] \| null` | `VNode \| null` |

These are type-only changes with no runtime impact. If you have a `FunctionalComponent<T>` that returns an array (e.g. via `utils.map`), wrap the result in a fragment:

```diff
- const MyList: FunctionalComponent<Props> = (props, children, utils) => utils.map(children, transform);
+ const MyList: FunctionalComponent<Props> = (props, children, utils) => <>{utils.map(children, transform)}</>;
```

#### `extras` Renamed to `compat`

The `extras` section of `stencil.config.ts` has been renamed to `compat`. Within it:

- `experimentalSlotFixes` (and the individual `slotChildNodesFix`, `scopedSlotTextContentFix`, `appendChildSlotFix` flags) have been consolidated into a single `lightDomPatches` option:
  ```ts
  lightDomPatches?: boolean | {
    slotChildNodes: boolean,
    slotCloneNode: boolean,
    slotDomMutations: boolean,
    slotTextContent: boolean,
  };
  ```
  `lightDomPatches` is `true` by default, but is only bundled into a build if light DOM components with slots are actually used. The `insertAdjacentText`/`insertAdjacentElement` patched methods have been removed entirely to save runtime bytes.
- `enableImportInjection` was previously opt-in; it is now opt-out (defaults to `true`).
- The deprecated `tagNameTransform`, `experimentalImportInjection`, and `experimentalScopedSlotChanges` options have been removed. Any functionality previously unique to `experimentalScopedSlotChanges` is now covered by the `lightDomPatches` options above.
- `suppressReservedPublicNameWarnings` / `suppressReservedEventNameWarnings` are renamed to `compat.suppressPublicNameWarnings` / `compat.suppressEventNameWarnings`.

To migrate, run `stencil migrate` - it will rename `extras` to `compat` and migrate the explicit `*Fix` options automatically.

#### Collection Importing / Re-bundling

In v4, importing *any* module/utility/type from a third-party Stencil-built library would re-bundle the *entire* library, even though this was never documented (only importing as a side effect, e.g. `import '@ionic/core'`, was documented). This implicit behavior is no longer supported.

To migrate, choose one of:
1. Import the library as a documented side effect: `import '@ionic/core'`.
2. Add the library to a new top-level `collections: string[]` config option in `stencil.config.ts`.

### Output Target Changes

#### Core Output Targets Renamed

`dist` and `dist-custom-elements` were never obvious about what they produced - the naming reflected historical decisions rather than intent, and `dist-custom-elements` always felt like an afterthought (missing features like global styles that `dist` had). In v5 the two are equally-weighted, clearly-named output targets, and previously-implicit sub-outputs are now explicit, first-class output targets in their own right:

| Was                              | Now                | Default directory      |
| ---------------------------------- | -------------------- | ------------------------- |
| `dist`                            | `loader-bundle`      | `dist/loader-bundle/`     |
| `dist-custom-elements`            | `standalone`         | `dist/standalone/`        |
| `dist-hydrate-script`             | `ssr`                | `dist/ssr/`                |
| (implicit sub-output of `dist`)    | `types` *(new, optional, auto-generated in production)* | `dist/types/`      |
| (implicit sub-output of `dist`)    | `collection` *(new, optional, auto-generated in production)* | `dist/collection/` |

Additional related changes:
- `dist.typesDir` removed - use `types.dir`.
- `dist.collectionsDir` removed - use `collection.dir`.
- `collectionDir` and `typesDir` removed from `loader-bundle` config entirely.
- `dist-custom-elements.isPrimaryPackageOutputTarget` removed - choose your own default export in `package.json` (CLI hints will guide you based on your configured outputs). `validatePrimaryPackageOutputTarget` config option renamed to `validatePackageJson`.
- `dist-custom-elements.generateTypeDeclarations` removed - types are now always generated and written to `types.dir`.
- `dist.esmLoaderPath` renamed to `loaderPath` - and its path is now calculated relative to `dist/loader-bundle` instead of `dist` (use `loaderPath: '../'` to reproduce the old resolved path).
- Export map generation now uses smart defaults: `loader-bundle` takes priority over `standalone` for the root package export, and types always come from the `types` output target.

To migrate, `stencil migrate` detects the deprecated output target types and config options and rewrites them automatically. Afterwards, double check your `package.json` `exports`/`main`/`module` fields against the new default directories - you may need to set an explicit `dir` on an output target to preserve an old path, or set `buildDir: '../'` on `loader-bundle` if you want its CDN-facing path to remain at the project's `dist/` root rather than `dist/loader-bundle/`.

#### `ssr` Output Target (formerly `dist-hydrate-script`)

Beyond the rename covered above:

- The output no longer writes a `package.json` file. Expose the SSR script via `exports` in your library's own `package.json` instead.
- The default script is now ESM (`index.js`); CommonJS is opt-in via `cjs: true` and outputs as `index.cjs` (previously `hydrate.js`/`hydrate.cjs.js`).
- The exported `hydrateDocument` function is renamed to `ssrDocument` (`hydrateDocument` remains exported, marked `@deprecated`).
- Config options prefixed `*Hydrate` are renamed to `*Ssr`: `beforeHydrate`/`afterHydrate` → `beforeSsr`/`afterSsr` (the old names remain exported, marked `@deprecated`).
- To make the output runtime-agnostic (not just Node.js), `streamToString()`'s return type changed from Node.js `Readable` to the web-standard `ReadableStream<string>`, which works in Node 22+, Cloudflare Workers, Deno, Bun, and other WinterCG runtimes.

#### `standalone`: `externalRuntime` Defaults to `false`

`externalRuntime` (on the output target formerly known as `dist-custom-elements`) now defaults to `false` - component bundles are self-contained by default, with the runtime included as a local shared chunk rather than left as an external `@stencil/core/runtime/client` import.

To migrate, set `externalRuntime: true` if you need multiple Stencil component libraries (or components from different libraries) on the same page to share a single runtime instance and avoid shipping it multiple times. Run `stencil migrate` to remove any now-redundant `externalRuntime: false`.

#### `www`: `serviceWorker` Defaults to `null`

The `www` output target's `serviceWorker` option now defaults to `null` (previously it generated a Workbox-powered service worker by default).

To migrate, set `serviceWorker: true` to restore automatic service worker generation. Run `stencil migrate` to remove any now-redundant `serviceWorker: null`.

#### `hashFileNames` / `hashedFileNameLength` Moved to Output Targets

These were previously top-level `stencil.config.ts` options, but only make sense for output targets that are loaded directly in the browser/CDN and have a single entry point. They've moved onto the `loader-bundle` and `www` output targets.

To migrate, run `stencil migrate` to move any explicit values into the appropriate output target(s) automatically.

#### Global Styles & Assets Modernized

`globalStyle` is now backed by its own first-class, configurable `global-style` output target (and multiple `global-style` outputs are now supported). The `extras.addGlobalStyleToComponents` option has been removed in favor of an `inject` property on the output target:

```ts
{
  type: 'global-style',
  inject: 'client', // 'none' (default) | 'client' | 'all'
}
```

Similarly, component `assetsDirs` are now backed by a first-class `assets` output target, auto-generated when components declare assets. Both `global-style` and `assets` write into a unified `dist/assets/` location, and `copyAssets` has been removed from the `loader-bundle` and `www` output targets accordingly.

To migrate, run `stencil migrate` - an explicit `extras.addGlobalStyleToComponents` is detected and rewritten into a `global-style` output target with the equivalent `inject` setting.

#### Output File Extensions Modernized

With CJS now a fringe/opt-in requirement, `"type": "module"` is strongly recommended, and file extensions have been standardized: `.esm.js` → `.js`, and (if `cjs: true` is set) `.cjs.js` → `.cjs`.

To migrate, update the relevant fields in your `package.json` to point at the new extensions - Stencil raises a warning when key `package.json` fields point at paths that no longer exist. Note that because the browser-facing `loader-bundle` CDN script is often referenced by URLs outside of your control, the old `NAMESPACE.esm.js` / `index.esm.js` entry points are **not** removed - it's kept as a permanent forwarding module.

### Configuration

#### `buildDist` and `buildDocs` Removed

These global config options were unclear in intent, quite blunt (e.g. `buildDocs` forced *all* docs outputs to build during dev), and inconsistent with how other flags controlled build output. They've been replaced with a per-output-target `skipInDev: boolean` option, giving granular control over what builds during `--dev`. By default, everything is `skipInDev: true` except the browser bundle (`loader-bundle`/`www`).

To migrate, run `stencil migrate` - it detects `buildDist`/`buildDocs` and rewrites your config automatically.

#### `--prod` Flag and `devMode` Config Removed

The `--prod` CLI flag has been removed - it was redundant, since production builds are already the default without an explicit `--dev` flag. The `devMode` config option has also been removed; opting into a dev build should be explicit and visible on the command line, not hidden in `stencil.config.ts`.

To migrate, remove `--prod` from CLI invocations (harmless no-op, but unnecessary). Use the `--dev` flag instead of `devMode` - `stencil migrate` will remove `devMode` from your config automatically. The `--esm` CLI flag has similarly been removed; configure `skipInDev` on your output targets instead.

#### Ambient Asset Imports Require a `?stencil` Suffix

Ambient asset module declarations (`*.css`, `*.svg`, `*.txt`, `*.frag`, `*.vert`) now require a `?stencil` suffix on the import specifier, e.g. `import styles from './my-styles.css?stencil'`. The previous bare `declare module "*.css"` was a global ambient type shipped by `@stencil/core`, which could silently clash with another package's own (differently-shaped) `*.css` module declaration in a monorepo. The `?stencil` marker disambiguates it, following the same convention already used for `*?worker` and `*?format=url|text`. This is a TypeScript-only change - runtime bundling of bare, non-suffixed asset imports is unaffected.

To migrate, run `stencil migrate` to append `?stencil` to existing raw asset imports automatically.

### Compiler API

#### `@stencil/core/compiler` No Longer Wildcard-Exports `stencil-private`

`@stencil/core/compiler` previously re-exported everything from `declarations/stencil-private.ts` via `export *`, which mixed genuinely compiler-facing types with runtime-internal ones (`HostElement`, `HostRef`, `RenderNode`, `PlatformRuntime`, `VNodeProdData`, SSR/worker internals) onto the public API surface. Only the subset actually consumed downstream is now re-exported by name: `ComponentCompilerMeta`, `ComponentCompilerTypeReferences`, `LazyBundlesRuntimeData`, `PackageJsonData`, `PrintLine`, `SsrResults`.

To migrate, if you were relying on the public host-element type for `componentOnReady()` or similar, use `HTMLStencilElement` from `@stencil/core/runtime` instead - it's the intentionally-narrow public counterpart to the internal `HostElement`.

## Stencil v4.0.0

- [New Configuration Defaults](#new-configuration-defaults)
  - [transformAliasedImportPaths](#transformaliasedimportpaths)
  - [transformAliasedImportPathsInCollection](#transformaliasedimportpathsincollection)
- [In Browser Compilation Support Removed](#in-browser-compilation-support-removed)
- [Legacy Context and Connect APIs Removed](#legacy-context-and-connect-APIs-removed)
- [Legacy Browser Support Removed](#legacy-browser-support-removed)
- [Legacy Cache Stats Config Flag Removed](#legacy-cache-stats-config-flag-removed)
- [Drop Node 14 Support](#drop-node-14-support)
- [Information Included in JSON Documentation Expanded](#information-included-in-docs-json-expanded)

### New Configuration Defaults
Starting with Stencil v4.0.0, the default configuration values have changed for a few configuration options.
The following sections lay out the configuration options that have changed, their new default values, and ways to opt-out of the new behavior (if applicable).

#### `transformAliasedImportPaths`

TypeScript projects have the ability to specify a path aliases via the [`paths` configuration in their `tsconfig.json`](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping) like so:
```json title="tsconfig.json"
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@utils": ["src/utils/index.ts"]
    }
  }
}
```
In the example above, `"@utils"` would be mapped to the string `"src/utils/index.ts"` when TypeScript performs type resolution.
The TypeScript compiler does not however, transform these paths from their keys to their values as a part of its output.
Instead, it relies on a bundler/loader to do the transformation.

The ability to transform path aliases was introduced in [Stencil v3.1.0](https://github.com/stenciljs/core/releases/tag/v3.1.0) as an opt-in feature.
Previously, users had to explicitly enable this functionality in their `stencil.config.ts` file with `transformAliasedImportPaths`:
```ts title="stencil.config.ts - enabling 'transformAliasedImportPaths' in Stencil v3.1.0"
import { Config } from '@stencil/core';

export const config: Config = {
  transformAliasedImportPaths: true,
  // ...
};
```

Starting with Stencil v4.0.0, this feature is enabled by default.
Projects that had previously enabled this functionality that are migrating from Stencil v3.1.0+ may safely remove the flag from their Stencil configuration file(s).

For users that run into issues with this new default, we encourage you to file a [new issue on the Stencil GitHub repo](https://github.com/stenciljs/core/issues/new?assignees=&labels=&projects=&template=bug_report.yml&title=bug%3A+).
As a workaround, this flag can be set to `false` to disable the default functionality.
```ts title="stencil.config.ts - disabling 'transformAliasedImportPaths' in Stencil v4.0.0"
import { Config } from '@stencil/core';

export const config: Config = {
  transformAliasedImportPaths: false,
  // ...
};
```

For more information on this flag, please see the [configuration documentation](https://stenciljs.com/docs/config#transformaliasedimportpaths)

#### `transformAliasedImportPathsInCollection`

Introduced in [Stencil v2.18.0](https://github.com/stenciljs/core/releases/tag/v2.18.0), `transformAliasedImportPathsInCollection` is a configuration flag on the [`dist` output target](https://stenciljs.com/docs/distribution#transformaliasedimportpathsincollection).
`transformAliasedImportPathsInCollection` transforms import paths, similar to [`transformAliasedImportPaths`](#transformaliasedimportpaths).
This flag however, only enables the functionality of `transformAliasedImportPaths` for collection output targets.

Starting with Stencil v4.0.0, this flag is enabled by default.
Projects that had previously enabled this functionality that are migrating from Stencil v2.18.0+ may safely remove the flag from their Stencil configuration file(s).

For users that run into issues with this new default, we encourage you to file a [new issue on the Stencil GitHub repo](https://github.com/stenciljs/core/issues/new?assignees=&labels=&projects=&template=bug_report.yml&title=bug%3A+).
As a workaround, this flag can be set to `false` to disable the default functionality.
```ts title="stencil.config.ts - disabling 'transformAliasedImportPathsInCollection' in Stencil v4.0.0"
import { Config } from '@stencil/core';

export const config: Config = {
  outputTargets: [
    {
      type: 'dist',
      transformAliasedImportPathsInCollection: false,
    },
    // ...
  ]
  // ...
};
```

For more information on this flag, please see the [`dist` output target's documentation](https://stenciljs.com/docs/distribution#transformaliasedimportpathsincollection).

### In Browser Compilation Support Removed

Prior to Stencil v4.0.0, components could be compiled from TSX to JS in the browser.
This feature was seldom used, and has been removed from Stencil.
At this time, there is no replacement functionality.
For additional details, please see the [request-for-comment](https://github.com/stenciljs/core/discussions/4134) on the Stencil GitHub Discussions page.

### Legacy Context and Connect APIs Removed

Previously, Stencil supported `context` and `connect` as options within the `@Prop` decorator.
Both of these APIs were deprecated in Stencil v1 and are now removed.

```ts
@Prop({ context: 'config' }) config: Config;
@Prop({ connect: 'ion-menu-controller' }) lazyMenuCtrl: Lazy<MenuController>;
```

To migrate away from usages of `context`, please see [the original deprecation announcement](#propcontext)
To migrate away from usages of `connect`, please see [the original deprecation announcement](#propconnect)

### Legacy Browser Support Removed

In Stencil v3.0.0, we announced [the deprecation of IE 11, pre-Chromium Edge, and Safari 10 support](#legacy-browser-support-fields-deprecated).
In Stencil v4.0.0, support for these browsers has been dropped (for a full list of supported browsers, please see our [Browser Support policy](https://stenciljs.com/docs/support-policy#browser-support)).
By dropping these browsers, a few configuration options are no longer valid in a Stencil configuration file:

#### `__deprecated__cssVarsShim`

The `extras.__deprecated__cssVarsShim` option caused Stencil to include a polyfill for [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*).
This field should be removed from a project's Stencil configuration file (`stencil.config.ts`).

#### `__deprecated__dynamicImportShim`

The `extras.__deprecated__dynamicImportShim` option caused Stencil to include a polyfill for
the [dynamic `import()` function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
for use at runtime.
This field should be removed from a project's Stencil configuration file (`stencil.config.ts`).

#### `__deprecated__safari10`

The `extras.__deprecated__safari10` option would patch ES module support for Safari 10.
This field should be removed from a project's Stencil configuration file (`stencil.config.ts`).

#### `__deprecated__shadowDomShim`

The `extras.__deprecated__shadowDomShim` option would check whether a shim for [shadow
DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
was needed in the current browser, and include one if so.
This field should be removed from a project's Stencil configuration file (`stencil.config.ts`). 

### Legacy Cache Stats Config Flag Removed

The `enableCacheStats` flag was used in legacy behavior for caching, but has not been used for some time. This
flag has been removed from Stencil's API and should be removed from a project's Stencil configuration file (`stencil.config.ts`).

### Drop Node 14 Support

Stencil no longer supports Node 14.
Please upgrade local development machines, continuous integration pipelines, etc. to use Node v16 or higher.
For the full list of supported runtimes, please see [our Support Policy](https://stenciljs.com/docs/support-policy#javascript-runtime).

### Information Included in `docs-json` Expanded

For Stencil v4 the information included in the output of the `docs-json` output
target was expanded to include more information about the types of properties
and methods on Stencil components.

For more context on this change, see the [documentation for the new
`supplementalPublicTypes`](https://stenciljs.com/docs/docs-json#supplementalpublictypes)
option for the JSON documentation output target.

#### `JsonDocsEvent`

The JSON-formatted documentation for an `@Event` now includes a field called
`complexType` which includes more information about the types referenced in the
type declarations for that property.

Here's an example of what this looks like for the [ionBreakpointDidChange
event](https://github.com/ionic-team/ionic-framework/blob/1f0c8049a339e3a77c468ddba243041d08ead0be/core/src/components/modal/modal.tsx#L289-L292)
on the `Modal` component in Ionic Framework:

```json
{
  "complexType": {
    "original": "ModalBreakpointChangeEventDetail",
    "resolved": "ModalBreakpointChangeEventDetail",
    "references": {
      "ModalBreakpointChangeEventDetail": {
        "location": "import",
        "path": "./modal-interface",
        "id": "src/components/modal/modal.tsx::ModalBreakpointChangeEventDetail"
      }
    }
  }
}
```

#### `JsonDocsMethod`

The JSON-formatted documentation for a `@Method` now includes a field called
`complexType` which includes more information about the types referenced in 
the type declarations for that property.

Here's an example of what this looks like for the [open
method](https://github.com/ionic-team/ionic-framework/blob/1f0c8049a339e3a77c468ddba243041d08ead0be/core/src/components/select/select.tsx#L261-L313)
on the `Select` component in Ionic Framework:

```json
{
  "complexType": {
    "signature": "(event?: UIEvent) => Promise<any>",
    "parameters": [
      {
        "tags": [
          {
            "name": "param",
            "text": "event The user interface event that called the open."
          }
        ],
        "text": "The user interface event that called the open."
      }
    ],
    "references": {
      "Promise": {
        "location": "global",
        "id": "global::Promise"
      },
      "UIEvent": {
        "location": "global",
        "id": "global::UIEvent"
      },
      "HTMLElement": {
        "location": "global",
        "id": "global::HTMLElement"
      }
    },
    "return": "Promise<any>"
  }
}
```

## Stencil v3.0.0

* [General](#general)
  * [New Configuration Defaults](#new-configuration-defaults)
    * [SourceMaps](#sourcemaps)
    * [`dist-custom-elements` Type Declarations](#dist-custom-elements-type-declarations)
  * [Legacy Browser Support Fields Deprecated](#legacy-browser-support-fields-deprecated)
    * [`dynamicImportShim`](#dynamicimportshim)
    * [`cssVarsShim`](#cssvarsshim)
    * [`shadowDomShim`](#shadowdomshim)
    * [`safari10`](#safari10)
  * [Deprecated `assetsDir` Removed from `@Component()` decorator](#deprecated-assetsdir-removed-from-component-decorator)
  * [Drop Node 12 Support](#drop-node-12-support)
  * [Strongly Typed Inputs](#strongly-typed-inputs)
  * [Narrowed Typing for `autocapitalize` Attribute](#narrowed-typing-for-autocapitalize-attribute)
  * [Custom Types for Props and Events are now Exported from `components.d.ts`](#custom-types-for-props-and-events-are-now-exported-from-componentsdts)
  * [Composition Event Handlers Renamed](#composition-event-handlers-renamed)
* [Output Targets](#output-targets)
  * [`dist-custom-elements` Output Target](#dist-custom-elements-output-target)
    * [Add `customElementsExportBehavior` to Control Export Behavior](#add-customelementsexportbehavior-to-control-export-behavior)
    * [Move `autoDefineCustomElements` Configuration](#move-autodefinecustomelements-configuration)
    * [Remove `inlineDynamicImports` Configuration](#remove-inlinedynamicimports-configuration)
  * [`dist-custom-elements-bundle` Output Target](#dist-custom-elements-bundle-output-target)
* [Legacy Angular Output Target](#legacy-angular-output-target)
* [Stencil APIs](#stencil-apis)
  * [Flag Parsing, `parseFlags()`](#flag-parsing-parseflags)
  * [Destroy Callback, `addDestroy()`, `removeDestroy()`](#destroy-callback-adddestroy-removedestroy)
* [End-to-End Testing](#end-to-end-testing)
  * [Puppeteer v10+ Required](#puppeteer-v10-required)

### General
#### New Configuration Defaults
Starting with Stencil v3.0.0, the default configuration values have changed for a few properties.

##### SourceMaps
Sourcemaps are generated by default for all builds.
Previously, sourcemaps had to be explicitly enabled by setting the `sourceMap` flag to `true`.
To restore the old behavior, set the `sourceMap` flag to `false` in your project's `stencil.config.ts`:
```ts
// stencil.config.ts
import { Config } from '@stencil/core';

export const config: Config = {
  sourceMap: false,
  // ...
};
```
##### `dist-custom-elements` Type Declarations
Type declaration files (`.d.ts` files) are now generated by default for the `dist-custom-elements` output target.
If your project is using `dist-custom-elements` and you do not wish to generate type declarations, the old behavior can be achieved by setting `generateTypeDeclarations` to `false` in the `dist-custom-elements` output target in your project's `stencil.config.ts`:
```ts
// stencil.config.ts
import { Config } from '@stencil/core';

export const config: Config = {
  outputTargets: [
    {
      type: 'dist-custom-elements',
      generateTypeDeclarations: false,
      // ...
    },
    // ...
  ],
  // ...
};
```

#### Legacy Browser Support Fields Deprecated

Several configuration options related to support for Safari <11, IE11, and Edge
<19 have been marked as deprecated, and will be removed entirely in a future
version of Stencil.

##### `dynamicImportShim`

The `extras.dynamicImportShim` option causes Stencil to include a polyfill for
the [dynamic `import()`
function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
for use at runtime. The field is renamed to `__deprecated__dynamicImportShim`
to indicate deprecation. To retain the prior behavior the new option can be
set in your project's `stencil.config.ts`:

```ts
// stencil.config.ts
import { Config } from '@stencil/core';

export const config: Config = {
  extras: {
    __deprecated__dynamicImportShim: true
  }
};
```

##### `cssVarsShim`

`extras.cssVarsShim` causes Stencil to include a polyfill for [CSS
variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*). For Stencil
v3.0.0 this field is renamed to `__deprecated__cssVarsShim`. To retain the
previous behavior the new option can be set in your project's
`stencil.config.ts`:

```ts
// stencil.config.ts
import { Config } from '@stencil/core';

export const config: Config = {
  extras: {
    __deprecated__cssVarsShim: true
  }
};
```

##### `shadowDomShim`

If `extras.shadowDomShim` is set to `true` the Stencil runtime will check
whether a shim for [shadow
DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
is needed in the current browser, and include one if so. For Stencil v3.0.0
this field is renamed to `__deprecated__shadowDomShim`. To retain the previous
behavior the new option can be set in your project's `stencil.config.ts`:

```ts
// stencil.config.ts
import { Config } from '@stencil/core';

export const config: Config = {
  extras: {
    __deprecated__shadowDomShim: true
  }
};
```

##### `safari10`

If `extras.safari10` is set to `true` the Stencil runtime will patch ES module
support for Safari 10. In Stencil v3.0.0 the field is renamed to
`__deprecated__safari10` to indicate deprecation. To retain the prior behavior
the new option can be set in your project's `stencil.config.ts`:

```ts
// stencil.config.ts
import { Config } from '@stencil/core';
export const config: Config = {
  extras: {
    __deprecated__safari10: true
  }
};
```

#### Deprecated `assetsDir` Removed from `@Component()` decorator
The `assetsDir` field was [deprecated in Stencil v2.0.0](#componentassetsdir), but some backwards compatibility was retained with a warning message.
It has been fully removed in Stencil v3.0.0 in favor of `assetsDirs`.
To migrate from existing usages of `assetsDir`, update the property name and wrap its value in an array:
```diff
@Component({
  tag: 'my-component',
- assetsDir: 'assets',
+ assetsDirs: ['assets'],
})
```
For more information on the `assetsDirs` field, please see the [Stencil Documentation on `assetsDirs`](https://stenciljs.com/docs/assets#assetsdirs)

#### Drop Node 12 Support
Stencil no longer supports Node 12.
Please upgrade local development machines, continuous integration pipelines, etc. to use Node v14 or higher.

#### Strongly Typed Inputs
`onInput` and `onInputCapture` events have had their interface's updated to accept an argument of `InputEvent` over `Event`:
```diff
- onInput?: (event: Event) => void;
+ onInput?: (event: InputEvent) => void;
- onInputCapture?: (event: Event) => void;
+ onInputCapture?: (event: InputEvent) => void;
```
`event` arguments to either callback should be updated to take this narrower typing into account

#### Narrowed Typing for `autocapitalize` Attribute
The [`autocaptialize` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize) has been narrowed from type `any` to type `string`.
This change brings Stencil into closer alignment with TypeScript's typings for the attribute.
No explicit changes are needed, unless a project was passing non-strings to the attribute.

#### Custom Types for Props and Events are now Exported from `components.d.ts`

Custom types for props and custom events are now re-exported from a project's `components.d.ts` file.

For the following Stencil component
```tsx
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

export type NameType = string;
export type Todo = Event;

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true,
})
export class MyComponent {
  @Prop() first: NameType;

  @Event() todoCompleted: EventEmitter<Todo>

  render() {
    return <div>Hello, World! I'm {this.first}</div>;
  }
}
```


The following data will now be included automatically in `components.d.ts`:
```diff
  import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
  import { NameType, Todo } from "./components/my-component/my-component";
+ export { NameType, Todo } from "./components/my-component/my-component";
  export namespace Components {
      interface MyComponent {
        "first": NameType;
      }
  }
  export interface MyComponentCustomEvent<T> extends CustomEvent<T> {
      detail: T;
      target: HTMLMyComponentElement;
  }
  declare global {
      interface HTMLMyComponentElement extends Components.MyComponent, HTMLStencilElement {
  }
```
This allows those types to be easily accessed from the root of the type distribution:
```ts
import { NameType, Todo } from '@my-lib/types';
```

When using `dist-custom-elements`, these types can now be accessed from the custom element output:
```ts
import { NameType, Todo } from '@my-custom-elements-output';
```

This _may_ clash with any manually created types in existing Stencil projects.
Projects that manually create type definitions from `components.d.ts` will either need to:
- remove the manually created type (if the types generated in `components.d.ts` suffice)
- update their type creation logic to account for potential naming collisions with the newly generated types

#### Composition Event Handlers Renamed

The names of Stencil's composition event handlers have been changed in order to
correct a casing issue which prevented handlers from being called when events
fired. The changes are as follows:

| previous name                | new name                     |
| ---------------------------- | ---------------------------- |
| `onCompositionEnd`           | `onCompositionend`           |
| `onCompositionEndCapture`    | `onCompositionendCapture`    |
| `onCompositionStart`         | `onCompositionstart`         |
| `onCompositionStartCapture`  | `onCompositionstartCapture`  |
| `onCompositionUpdate`        | `onCompositionupdate`        |
| `onCompositionUpdateCapture` | `onCompositionupdateCapture` |

### Output Targets

#### `dist-custom-elements` Output Target
##### Add `customElementsExportBehavior` to Control Export Behavior
`customElementsExportBehavior` is a new configuration option for the output target.
It allows users to configure the export behavior of components that are compiled using the output target.
By default, this output target will behave exactly as it did in Stencil v2.0.0.
For more information on how to configure it, please see the [documentation for the field](https://stenciljs.com/docs/custom-elements#customElementsExportBehavior).

##### Move `autoDefineCustomElements` Configuration
`autoDefineCustomElements` was a configuration option to define a component and its children automatically with the CustomElementRegistry when the component's module is imported.
This behavior has been merged into the [`customElementsExportBehavior` configuration field](#add-customelementsexportbehavior-to-control-export-behavior).
To continue to use this behavior, replace `autoDefineCustomElements` in your project's `stencil.config.ts` with the following:
```diff
// stencil.config.ts
import { Config } from '@stencil/core';

export const config: Config = {
  outputTargets: [
    {
      type: 'dist-custom-elements',
-      autoDefineCustomElements: true,
+      customElementsExportBehavior: 'auto-define-custom-elements',
      // ...
    },
    // ...
  ],
  // ...
};
```

#### Remove `inlineDynamicImports` Configuration

The `inlineDynamicImports` configuration option on `dist-custom-elements` has been removed. Previously, this option would throw an error at build
time during the Rollup bundling process if the build contained multiple "inputs" (components).

#### `dist-custom-elements-bundle` Output Target
The `dist-custom-elements-bundle` has been removed starting with Stencil v3.0.0, following the [RFC process](https://github.com/stenciljs/core/issues/3136).
Users of this output target should migrate to the `dist-custom-elements` output target.

By default, `dist-custom-elements` does not automatically define all a project's component's with the `CustomElementsRegistry`.
This allows for better treeshaking and smaller bundle sizes.

For teams that need to migrate quickly to `dist-custom-elements`, the following configuration should be close to a drop-in replacement for `dist-custom-elements-bundle`:
```diff
// stencil.config.ts
import { Config } from '@stencil/core';

export const config: Config = {
  outputTargets: [
-    {
-      type: 'dist-custom-elements-bundle',
-      // additional configuration
-    },
+    {
+      type: 'dist-custom-elements',
+      customElementsExportBehavior: 'bundle'
+    },
    // ...
  ],
  // ...
};
```
However, it does not necessarily improve treeshaking/bundle size.
For more information on configuring this output target, please see the [`dist-custom-elements` documentation](https://stenciljs.com/docs/custom-elements)

### Legacy Angular Output Target
Prior to the creation of the [`@stencil/angular-output-target`](https://github.com/stenciljs/core-ds-output-targets/blob/main/packages/angular-output-target/README.md), the `'angular'` output target was the original means of connecting a Stencil component to an Angular application.
This output target has been removed in favor of `@stencil/angular-output-target`.
Please migrate to `@stencil/angular-output-target` and remove the `'angular'` output target from your `stencil.config.ts` file.
Instructions for doing so can be found [on the Stencil site](https://stenciljs.com/docs/angular#setup)

### Stencil APIs
Stencil exposes Node APIs for programmatically invoking the compiler.
Most users do not use these APIs directly.
Unless your project calls these APIs, no action is required for this section.

#### Flag Parsing, `parseFlags()`
Stencil exposes an API for parsing flags that it receives from the command line.
Previously, it accepted an optional `CompilerSystem` argument that was never properly used.
The flag has been removed as of Stencil v3.0.0.
To migrate, remove the argument from any calls to `parseFlags` imported from the Stencil CLI package.
```diff
import { parseFlags } from '@stencil/core/cli';
- parseFlags(flags, compilerSystem);
+ parseFlags(flags);
```

#### Destroy Callback, `addDestroy()`, `removeDestroy()`
The Stencil `CompilerSystem` interface has a pair of methods, `addDestroy` and `removeDestroy` that were previously misspelled.
If your codebase explicitly calls these methods, they need to be updated.
Replace all instances of `addDestory` with `addDestroy` and all instances of `removeDestory` with `removeDestroy`
The functionality of these methods remains the same.

### End-to-End Testing
#### Puppeteer v10+ Required
Versions of Puppeteer prior to Puppeteer version 10 are no longer supported.
In newer versions of Puppeteer, the library provides its own types, making `@types/puppeteer` no longer necessary.
Ensure that Puppeteer v10 or higher is installed, and that its typings are not:
```bash
$ npm install puppeteer
$ npm uninstall @types/puppeteer
```

To see which versions of Puppeteer are supported by Stencil, please see our [support matrix](https://stenciljs.com/docs/support-policy#puppeteer)


*****

## Stencil Two

In keeping with [Semver](https://semver.org/), Stencil `2.0.0` was released due to changes in the API (mainly from some updates to the config API). But even though this is a new major version, there are few breaking changes.

### BREAKING CHANGES

While migrating from Stencil One, any changes will be flagged and described by the compiler during development. For the most part, most of the changes are removal of deprecated APIs that have been printing out warning logs for quite some time now

#### Opt-in for IE11, Edge 16-18 and Safari 10 Builds

- **config:** update config extra defaults to not build IE11, Edge 16-18 and Safari 10 by default ([363bf59](https://github.com/stenciljs/core/commit/363bf59fc9212a771a766c21909263d6c4ccdf18))

A change in Stencil 2 is that the IE11, Edge 16-18 and Safari 10 builds will not be enabled by default. However, the ability to opt-in is still available, and can be enabled by setting each `extras` config flag to `true`. An advantage of this is less runtime within your builds. See the [config.extras docs](https://stenciljs.com/docs/config-extras) for more info.

#### Opt-in for ES5 and SystemJS Builds

- **config:** do not build es5 by default ([fa67d97](https://github.com/stenciljs/core/commit/fa67d97d043d12e0a3af0d868fa1746eb9e3badf))

Just like having to opt-in for IE11, the same goes for opting-in for ES5 and SystemJS builds. For a production build in Stencil 1, it would build both ES2017/ESM files, and ES5/SystemJS files. As of Stencil 2, both dev and prod builds do not create ES5/SystemJS builds. An advantage of this is having faster production builds by not having to also downlevel to es5. See the [buildEs5](https://stenciljs.com/docs/config#buildes5) for more info.

#### Use `disconnectedCallback()` instead of `componentDidUnload()`

- **componentDidUnload:** use disconnectedCallback instead of componentDidUnload ([4e45862](https://github.com/stenciljs/core/commit/4e45862f73609599a7195fcf5c93d9fb39492154))

When Stencil is used within other frameworks, DOM elements may be reused, making it impossible for `componentDidUnload()` to be accurate 100% of the time if it is disconnected, then re-connected, and disconnected again. Instead, `disconnectedCallback()` is the preferred way to always know if a component was disconnected from the DOM.

_Note that the runtime still works for any collections that have been built with componentDidUnload(). However, updates to Stencil 2 will require it's changed to disconnectedCallback()._

#### Default to `async` task queue

- **taskQueue:** set "async" taskQueue as default ([f3bb121](https://github.com/stenciljs/core/commit/f3bb121b8130e0c4e0c344eca7078ce572ad34a5))

Update taskQueue default to "async". Stencil 1 default was "congestionAsync". See [config.taskQueue](https://stenciljs.com/docs/config#taskqueue) for more info.

#### Restore Stencil 1 defaults

```ts
export const config: Config = {
  buildEs5: 'prod',
  extras: {
    cssVarsShim: true,
    dynamicImportShim: true,
    safari10: true,
    shadowDomShim: true,
  },
};
```

#### dist package.json

To ensure the extensions are built for the future and work with today's bundlers, we've found it best to use `.cjs.js` extension for CommonJS files, and `.js` for ESM files, with the idea that cjs files will no longer be needed some day, and the ESM files are the standard. _(We were using `.mjs` files, but not all of today's tooling and bundlers work well with that extension)._

If you're using the `dist` output target, update the `package.json` in the root of your project, like this:

```diff
  {
-    "main": "dist/index.js",
+    "main": "dist/index.cjs.js",

-    "module": "dist/index.mjs",
+    "module": "dist/index.js",

-    "es2015": "dist/esm/index.mjs",
+    "es2015": "dist/esm/index.js",

-    "es2017": "dist/esm/index.mjs",
+    "es2017": "dist/esm/index.js",

-    "jsnext:main": "dist/esm/index.mjs",
+    "jsnext:main": "dist/esm/index.js",
  }
```

Additionally the `dist/loader` output directory has renamed its extensions too, but since its `dist/loader/package.json` file is auto-generated, the entries were renamed too. So unless you were referencing the loader files directly you will not have to do external updates.

See the [Output Folder Structure Defaults](https://github.com/stenciljs/core/blob/main/src/compiler/output-targets/readme.md) for more info.

#### NodeJS Update

- **node:** minimum of Node 12.10.0, recommend 14.5.0 or greater ([55331be](https://github.com/stenciljs/core/commit/55331be42f311a6e2a4e4f8ac13c01d28dc31613))

With the major release, now's a good time to update the minimum and recommended version of NodeJS.

- [Node Releases](https://nodejs.org/en/about/releases/)
- [node.green](https://node.green/)

*****

## Stencil One

Most of the updates for the `1.0.0` release involve removing custom APIs, and continuing to leverage web-standards in order to generate future-proof components that scale.

Additionally, these updates allow Stencil to further improve its tooling, with a focus on great developer experience for teams maintaining codebases across large organizations.


### BREAKING CHANGES

A common issue with JSX is each separate project's use of global JSX types. Many of the required changes are in order to avoid global types, which often cause issues for apps which import from numerous packages. The other change is having each component import its renderer, such as JSX's `h()` function.

#### Import `{ h }` is required

In order to render JSX in Stencil apps, the `h()` function must be imported from `@stencil/core`:

```diff
+ import { h } from '@stencil/core';

function app() {
  return <ion-app></ion-app>
}
```

The `h` stands for "hyperscript", which is what JSX elements are transformed into (it's the actual function executed when rendering within the runtime). Stencil's `h` import is an equivalent to React's [React.createElement](https://reactjs.org/docs/react-without-jsx.html). This also explains why the app's `tsconfig.json` sets the `{ "jsxFactory": "h" }` config, which is detailed further in  [TypeScript's JSX Factory Function Docs](https://www.typescriptlang.org/docs/handbook/jsx.html#factory-functions).

You might think that `h` will be marked as "unused" by linters, but it's not! Any JSX syntax you write, is equivalent to using `h` directly, and the typescript's tooling is aware of that.

```tsx
const jsx = <ion-button>;
```

is the same as:

```tsx
const jsx = h('ion-button', null, null);
```


#### index.html's `<script>`s updated to use `type="module"`

Stencil used to generate a loader `.js` file that automatically decided which entry-point to load based in the browser's capabilities. In Stencil 1.0 we have decided to completely remove the overhead of this loader by directly loading the core using the web-standard `type="module"` script attribute. Less runtime and preferring native browser features. Win Win. For more for info, please see [Using JavaScript modules on the web](https://developers.google.com/web/fundamentals/primers/modules#browser).

```diff
- <script src="/build/app.js"></script>
+ <script type="module" src="/build/app.esm.js"></script>
+ <script nomodule src="/build/app.js"></script>
```

#### Collection's package.json

Stencil One has changed the internal folder structure of the `dist` folder, and some entry-points are located in different location:

- **"module"**: `dist/esm/index.js` => `dist/index.mjs`
- **"jsnext:main**": `dist/esm/es2017/index.js` => `dist/esm/index.mjs`


Make sure you update the `package.json` in the root of your project, like this:

```diff
  {
     "main": "dist/index.js",

-    "module": "dist/esm/index.js",
+    "module": "dist/index.mjs",

-    "es2015": "dist/esm/es2017/index.js",
-    "es2017": "dist/esm/es2017/index.js",
-    "jsnext:main": "dist/esm/es2017/index.js",
+    "es2015": "dist/esm/index.mjs",
+    "es2017": "dist/esm/index.mjs",
+    "jsnext:main": "dist/esm/index.mjs",
  }
```

#### Dependencies

Some packages, specially the ones from the Stencil and Ionic core teams used some private APIs of Stencil, that's why if your collection depends of `@ionic/core`, `@stencil/router` or `@stencil/state-tunnel`, you might need to update your `package.json` to point these dependencies to the `"one"` tag.

```
"@ionic/core": "one",
"@stencil/router": "^1.0.0",
"@stencil/state-tunnel": "^1.0.0",

"@stencil/sass": "^1.0.0",
"@stencil/less": "^1.0.0",
"@stencil/stylus": "^1.0.0",
"@stencil/postcss": "^1.0.0",
```

#### `window.NAMESPACE` is no longer a thing

Stencil will not read/write to the browser's global `window` anymore. So things like `window.App` or `window.Ionic` are gone, and should be provided by the user's code if need be.


#### `@Prop() mode` is no longer reserved prop

`@Prop() mode` used to be the way to define and read the current mode of a component. This API was removed since it was very local to the use case of Ionic.

Instead, the `mode` can be read by using the `getMode()` method from `@stencil/core`.


#### Removed: Global `JSX`

For all the same reasons for now importing `h`, in order to prevent type collision in the future, we have moved to local scoped JSX namespaces. Unfortunately, this means `JSX` is no longer global and it needs to be imported from `@stencil/core`. Also, note that while the below example has the render function with a return type of `JSX.Element`, we recommend to not have a return type at all:

```tsx
import { JSX, h } from '@stencil/core';

render(): JSX.Element {
  return <ion-button></ion-button>
}
```

- `HTMLAttributes` might not be available as a global
- `JSX`

#### Removed: Global `HTMLAttributes`

`HTMLAttributes` used to be exposed as a global interface, just like the `JSX` namespace, but that caused type conflicts when mixing different versions of stencil in the same project.

Now `HTMLAttributes` is part of `JSXBase`, exposed in `@stencil/core`:

```ts
import { JSXBase } from '@stencil/core';

JSXBase.HTMLAttributes

```

#### Removed: Global `HTMLStencilElement`

The global type for `HTMLStencilElement` has been removed. Instead, it's better is to use the exact type of your component, such as `HTMLIonButtonElement`. The HTML types are automatically generated within the `components.d.ts` file.


#### Removed: Global `StencilIntrinsicElement`

The global type `StencilIntrinsicElement` has been removed. It can be replaced by importing the `JSX` namespace from `@stencil/core`:

```tsx
import { JSX } from '@stencil/core';

export type StencilIntrinsicElement = JSX.IntrinsicElement;
```

#### Removed: @Listen('event.KEY’)

It's no longer possible to use the `event.KEY` syntax in the `@Listen` decorator in order to only listen for specific key strokes.
Instead, the browser already implements easy-to-use APIs:

**BEFORE:**

```ts
@Listen('keydown.enter')
onEnter() {
  console.log('enter pressed');
}
```

**AFTER:**

```ts
@Listen('keydown')
onEnter(ev: KeyboardEvent) {
  if (ev.key === 'Enter') {
    console.log('enter pressed');
  }
}
```

#### Removed: @Listen('event’, { enabled })

It's not possible to programmatically enable/disable an event listener defined using the `@Listen()` decorator. Please use the DOM API directly (`addEventListener` / `removeEventListener`).

#### Removed: @Listen('event’, { eventName })

The event name should be provided excl

#### Removed: @Component({ host })

This feature was deprecated a long time ago, and it is being removed definitely from Stencil.

#### `mockDocument()` and `mockWindow()` has been moved

The `mockDocument()` and `mockWindow()` functions previously in `@stencil/core/mock-dom` has been moved to:
`@stencil/core/testing`:

```diff
- import { mockDocument, mockWindow } from '@stencil/core/mock-dom';
+ import { mockDocument, mockWindow } from '@stencil/core/testing';
```

### DEPRECATIONS

#### outputTarget "docs"

The output target "docs" has been renamed to "docs-readme":

In your `stencil.config.ts` file:
```diff
export const config = {
  outputTargets: [
    {
-     type: 'docs',
+     type: 'docs-readme',
    }
  ]
};
```


#### `hostData()`

hostData() usage has been replaced by the new `Host` exposed in `@stencil/core`. The `<Host>` JSX element represents the "host" element of the component, and simplifies being able to add attributes and CSS classes to the host element:

```diff
+ import { Host } from '@stencil/core';

-  hostData() {
-    return {
-      'class': {
-        'my-class': true,
-        'disabled': this.isDisabled
-      },
-      attr: this.attrValue
-    };
-  }
  render() {
    return (
+      <Host
+        class={{
+          'my-class': true,
+          'disabled': this.isDisabled
+        }}
+        attr={this.attrValue}
+      />
    );
  }
```

#### All void methods return promise (right now method(): void is valid)

Until Stencil 1.0, public component methods decorated with `@Method()` could only return `Promise<...>` or `void`.
Now, only the `async` methods are supported, meaning that retuning `void` is not valid.

```diff
  @Method()
- doSomething() {
+ async doSomething() {
    console.log('hello');
  }
```

This change was motivated by the fact that Stencil's 1.0 runtime will be able to proxy all component method calls!
That means, developers will be able to call component methods safely without using componentOnReady()! even if the actual component has not been downloaded yet.

##### Given an example component like:

```ts
@Component(...)
export class Cmp {
  @Method()
  async doSomething() {
    console.log('called');
  }
}
```

**BEFORE:**

```ts
// Calling `componentOnReady()` was required in order to make sure the "component"
// was properly lazy loaded and the methods are available.
await element.componentOnReady()
element.doSomething();
```

**AFTER:**

```ts
// Stencil One will automatically proxy the method call (like an RPC),
// and it's safe to call any method without using `componentOnReady()`.
await element.doSomething();
```


#### `@Listen('TARGET:event’)`

The first argument of the `@Listen()` decorator is now only the event name, such as `click` or `resize`. Previously you could set the target of the listener by prefixing the event name with something like `window:resize`. Instead, the target is now set using the options.

```diff
- @Listen('window:event')
+ @Listen('event’, { target: 'window' })

- @Listen('document:event')
+ @Listen('event’, { target: 'document' })

- @Listen('body:event’)
+ @Listen('event’, { target: 'body’ })

- @Listen('parent:event’)
+ @Listen('event’, { target: 'parent’ })
```

This change was motivated by the fact that `body:event` is a valid DOM event name.
In addition, the new syntax allows for strong typing, since the `{target}` only accepts the following string values (`'window'`, `'document'`, `'body'`, `'parent'`).

#### `@Prop({context})`

Using the `@Prop` decorator with the `context` has been deprecated and their usage is highly unrecommended. Here's how update each case:


##### `'window'`

Accessing `window` using `Prop({context: 'window'})` was previously required because of Server-side-rendering requirements, fortunately this is no longer needed, and developers can use global `window` directly.

- `Prop({context: 'window'})` becomes `window`

```diff
-  @Prop({context: 'window'}) win!: Window;

   method() {
     // print window
-    console.log(this.win);
+    console.log(window);
   }
```

##### `'document'`

Accessing `document` using `Prop({context: 'document'})` was previously required because of Server-side-rendering requirements, fortunately this is no longer needed, and developers can use global `document` directly.

- `Prop({context: 'document'})` becomes `document`

```diff
-  @Prop({context: 'document'}) doc!: Document;

   method() {
     // print document
-    console.log(this.doc);
+    console.log(document);
   }
```

##### `'isServer'`

In order to determine if the your component is being rendered in the browser or the server as part of some prerendering/ssr process, stencil exposes a compiler-time constant through the `Build` object, exposed in `@stencil/core`:

- `Prop({context: 'isServer'})` becomes `!Build.isBrowser`

```diff
+  import { Build } from '@stencil/core';

   [...]

-  @Prop({context: 'isServer'}) isServer!: boolean;

   method() {
-    if (!this.isServer) {
+    if (Build.isBrowser) {
       console.log('only log in the browser');
     }
   }
```

#### `@Prop(connect)`

It will not be recommended to use `@Prop(connect)` in order to lazily load components. Instead it's recommended to use ES Modules and/or dynamic imports to load code lazily.


#### `@Component.assetsDir`

```diff
@Component({
-  assetsDir: 'resource',
+  assetsDirs: ['resource']
})
```

#### OutputTarget local copy tasks

The root `copy` property in `stencil.config.ts` has been deprecated in favor of local copy tasks per output-target, ie. now the copy tasks are specific under the context of each output-target.

```diff
  const copy =
  export const config = {
    outputTargets: [
      {
        type: 'www',
+       copy: [
+        {
+           src: 'index-module.html',
+           dest: 'index-module.html'
+         }
+       ]
      }
    ],
-   copy: [
-     {
-       src: 'index-module.html',
-       dest: 'index-module.html'
-     }
-   ]
  };
```

This change has been motivated by the confusing semantics of the root copy task, currently the copy tasks are executed multiple times within different working-directories for each output-target.

Take this example:

```ts
export const config = {
  outputTargets: [
    { type: 'dist' },
    { type: 'dist', dir: 'dist-app' },
    { type: 'www' }
  ],
  copy: [
    { src: 'main.html' }
  ]
};
```

In the example above, the `main.html` file is actually copied into 5 different places!!

- dist/collection/main.html
- dist/app/main.html
- dist-app/collection/main.html
- dist-app/app/main.html
- www/main.html

If the old behavior is still desired, the config can be refactored to:

```ts
const copy = [
  { src: 'main.html' }
];

export const config = {
  outputTargets: [
    { type: 'dist', copy },
    { type: 'dist', dir: 'dist-app', copy },
    { type: 'www', copy }
  ]
};
```

### New APIs

#### setMode() and getMode()

#### getAssetsPath(this, relativePath)

#### `dist-module` output target



### Testing

#### `newSpecPage()` Spec Testing Utility

A new testing utility has been created to make it easier to unit test components. Its API is similar to `newE2EPage()` for consistency, but internally `newSpecPage()` does not use Puppeteer, but rather runs on top of a pure Node environment. Additionally, user code should not have to be written with legacy CommonJS, and code can safely use global browser variables such as `window` and `document`. In the example below, a mock `CmpA` component was created in the test, but it could have also imported numerous existing components and registered them into the test using the `components` config. The returned `page` variable also has a  `root` property, which is convenience property to get the top-level component found in the test.

```tsx
import { Component, Prop } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

it('override default values from attribute', async () => {
  @Component({
    tag: 'cmp-a'
  })
  class CmpA {
    @Prop() someProp = '';
    render() {
      return `${this.someProp}`;
    }
  }

  const page = await newSpecPage({
    components: [CmpA],
    html: `<cmp-a some-prop="value"></cmp-a>`,
  });

  // "root" is a convenience property which is the
  // the top level component found in the test
  expect(page.root).toEqualHtml(`
    <cmp-a some-prop="value">
      value
    </cmp-a>
  `);

  expect(page.root.someProp).toBe('value');
});
```


#### Serialized `<mock:shadow-root>`

Traditionally, when a component is serialized to a string its shadow-root is ignored and not include within the HTML output. However, when building web components and using Shadow DOM, the nodes generated within the components are just as important as any other nodes to be tested. For this reason, both spec and e2e tests will serialize the shadow-root content into a mocked `<mock:shadow-root>` element. Note that this serialized shadow-root is simply for testing and comparing values, and is not used at browser runtime.

```tsx
import { Component } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

it('test shadow root innerHTML', async () => {
  @Component({
    tag: 'cmp-a',
    shadow: true
  })
  class CmpA {
    render() {
      return (
        <div>Shadow Content</div>
      );
    }
  }

  const page = await newSpecPage({
    components: [CmpA],
    html: `
      <cmp-a>
        Light Content
      </cmp-a>
    `,
  });

  expect(page.root).toEqualHtml(`
    <cmp-a>
      <mock:shadow-root>
        <div>
          Shadow Content
        </div>
      </mock:shadow-root>
      Light Content
    </cmp-a>
  `);
});
```


#### Jest Presets

When running Jest directly, previously most of Jest had to be manually configured within each app's `package.json`, and required the `transform` config to be manually wired up to Stencil's `jest.preprocessor.js`. With the latest changes, most of the Jest config can be replaced with just `"preset": "@stencil/core/testing"`. You can still override the preset defaults, but it's best to start with the defaults first. Also note, the Jest config can be avoided entirely by using the `stencil test --spec` command rather than calling Jest directly.

```diff
  "jest": {
+    "preset": "@stencil/core/testing"
-    "transform": {
-      "^.+\\.(ts|tsx)$": "<rootDir>/node_modules/@stencil/core/testing/jest.preprocessor.js"
-    },
-    "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(tsx?|jsx?)$",
-    "moduleFileExtensions": [
-      "ts",
-      "tsx",
-      "js",
-      "json",
-      "jsx"
-    ]
  }
```