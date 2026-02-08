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


## Output Target Types

### `www`

- Default output target when not configured.
- Generates a stand-alone `app` into the `www/` directory.
- Depending on the number of components and configuration, the app may be lazy-loaded of single-file.


### `dist`

- Generates `modules` to be imported by other bundlers, such as `dist/esm/` and `dist/esm-es5/` (when enabling buildEs5 config).
- Generates an `app` at the root of the `dist/` directory. It's the same stand-alone webapp as the `www` type, but located in dist so it's easy to package up and shared.
- Generates a `collection` into the `dist/collection/` directory to be used by other projects.


### `angular`

- Generates a wrapper Angular component proxy.
- Web components themselves work fine within Angular, but you loose out on many of Angular's features, such as types or `@ViewChild`. In order for a Stencil project to fit right into the Angular ecosystem, this output target generates thin wrapper that can be imported by Angular.


### `dist-hydrate-script`

- Used by NodeJS to do Static Site Generation (SSG) and/or Server Side Rendering (SSR). 
- Used by Stencil prerendering commands.
- Formats the components so that the server can generate new global window environments that are scoped to each rendering, rather than having global information bleed between each URL rendered.


## Output Folder Structure Defaults

```
- dist/

  - cjs/ (bundler ready, cjs modules)
    - index.cjs.js
    - loader.cjs.js

  - collection/ (metadata when this is lazy-loaded dependency)
    - my-cmp/
      - my-cmp.js (esm)
      - my-cmp.css
    - collection-manifest.json
    - global.js
  
  - custom-elements (bundler ready custom elements, esm only)
    - index.js (esm)
    - index.d.ts

  - esm (bundler ready, esm modules, es2017 source)
    - index.js
    - loader.js

  - esm-es5 (buildEs5, bundler ready, esm modules, es5 source)
    - index.js
    - loader.js

  - loader (bundler entry for lazy builds)
    - cdn.js
    - index.js
    - index.cjs.js
    - index.d.ts
    - index.es2017.js
    - package.json (to import loader package, such as myapp/loader)

  - myapp (browser ready script, named from stencil config namespace)
    - myapp.css
    - myapp.esm.js
    - myapp.js (buildEs5 entry, systemjs modules, es5 source)
    - myapp.system.js (buildEs5, systemjs modules, es5 source)

  - types (dts files for each component)
    - my-cmp/
      -my-cmp.d.ts

  - index.cjs.js (dist cjs entry)
  - index.js (dist esm entry)

- hydrate
  - index.js (NodeJS ready hydrate script, cjs module)
  - index.d.ts (types for hydrate API)
  - package.json (to import hydrate package, such as myapp/hydrate)

- www/ (www output target)
  - build/
    - myapp.esm.js (browser ready esm modern script)
    - myapp.js (buildEs5, browser ready systemjs modules, es5 script)

  - index.html (optimized html from src/index.html)

- package.json (top-level package.json is not auto-updated)
- stencil.config.ts
```