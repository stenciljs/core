# Output Targets

Stencil is able to generate components into various formats so they can be best integrated into the many different apps types, no matter what framework or bundler is used.

## Output Target Terms

`script`: A prebuilt, stand-alone webapp already built from the components. These are already built to be loaded by just a script tag, no additional builds or bundling required. Both the `www` and `dist` output target types save an "app" into their directories. When saving the webapp into the `dist/` directory, it can be easily packaged up and used with a service like `unpkg.com`. See https://www.npmjs.com/package/@ionic/core

`collection`: Source files transpiled down to simple JavaScript, and all component metadata placed on the component class as static getters. When one Stencil distribution imports another, it will use these files when generating its own distribution. What's important is that the source code of a `collection` is future proof, meaning no matter what version of Stencil it can import and understand the component metadata.

`host`: The actual "host" element sitting in the webpage's DOM.

`lazy-loaded`: A lazy-loaded webapp creates all the proxied host custom elements up front, but only downloads the component implementation on-demand. Lazy-loaded components work by having a proxied "host" custom element, and lazy-loads the component class and css, and rather than the host element having the "instance", such as a traditional custom element, the instance is of the lazy-loaded component class. If a Stencil library has a low number of components, then having them all packaged into a single-file would be best. But for a very large library of components, such as Ionic, it'd be best to have them lazy-loaded instead. Part of the configuration can decide when to make a library either lazy-loaded or single-file.

`module`: Component code meant to be imported by other bundlers in order for them to be integrated within other apps.

`native`: Lazy-loaded components split the host custom element and the component implementation apart. A "native" component is a traditional custom element in that the instance and host element are the same.

`custom-element`: Individual custom elements packaged up into stand-alone, self-contained code. Each component imports shared runtime from `@stencil/core`. Opposite of lazy-loaded components that define themselves and load on demand, the custom elements builds must be imported and defined by the consumer, and any lazy-loaded depends on the consumer's bundling methods.

## Output Target Types (v5 names)

v5 renamed several output targets for clarity and elevated some sub-outputs to first-class targets. `stencil migrate` rewrites a v4 config automatically.

### `loader-bundle` (was `dist`)

- Default output target when not configured (`www` is no longer the default).
- Generates a lazy-loaded, script-tag-ready bundle plus `modules` for other bundlers to import.
- No longer generates CJS by default - opt in with `cjs: true`.

### `standalone` (was `dist-custom-elements`)

- Bundler-ready, single-file custom elements build. Each component imports shared runtime from `@stencil/core` unless `externalRuntime: true` is set (default `false` in v5 - the runtime is bundled as a shared local chunk instead).

### `ssr` (was `dist-hydrate-script`)

- Used by Node.js to do Static Site Generation (SSG) and/or Server Side Rendering (SSR), and by Stencil's prerendering commands.
- Formats components so the server can generate new global window environments scoped to each render, rather than global information bleeding between URLs rendered in the same process.
- No longer generates a `package.json` - expose the script via `exports` in the library's own `package.json`.

### `collection` and `types` (formerly sub-outputs of `dist`)

- Now first-class output targets in their own right (`collectionDir`/`typesDir` config options on `loader-bundle` were removed accordingly), auto-generated in production builds.

### `global-style` and `assets` (new in v5)

- Auto-generated first-class targets when `globalStyle` config / component `assetsDirs` are present. Both write into a unified `dist/assets/` location.

### `www`

- No longer the default. Generates a stand-alone app into the `www/` directory; may be lazy-loaded or single-file depending on component count/config.

## Output Folder Structure Defaults

```
- dist/

  - cjs/ (bundler ready, cjs modules - only when cjs: true)
    - index.cjs
    - loader-bundle.cjs

  - collection/ (metadata when this is a lazy-loaded dependency)
    - my-cmp/
      - my-cmp.js (esm)
      - my-cmp.css
    - collection-manifest.json
    - global.js

  - standalone/ (bundler ready custom elements, esm only)
    - index.js (esm)
    - index.d.ts

  - loader-bundle/ (bundler entry for lazy builds)
    - cdn.js
    - index.js
    - index.cjs (only when cjs: true)
    - index.d.ts

  - assets/ (global styles + component assetsDirs, shared location)

  - types/ (dts files for each component)
    - my-cmp/
      - my-cmp.d.ts

  - index.cjs (dist cjs entry - only when cjs: true)
  - index.js (dist esm entry)

- ssr/
  - index.js (Node.js ready SSR script, esm module)
  - index.d.ts (types for the SSR API)

- www/ (www output target)
  - build/
    - myapp.js (browser ready esm script, named from stencil config namespace)

  - index.html (optimized html from src/index.html)

- package.json (top-level package.json is not auto-updated, should have "type": "module")
- stencil.config.ts
```