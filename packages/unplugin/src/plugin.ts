/**
 * Unplugin factory for @stencil/unplugin.
 *
 * Wires together 6 concerns into a single plugin that works across Vite,
 * Rollup, webpack, rspack, and bun:
 *
 *  1. **Component transform** - `transform` drives `transpileSync` on every
 *     `.tsx`/`.ts` file that carries Stencil decorators, producing
 *     `customelement` output (self-registering class + `defineCustomElement`).
 *
 *  2. **CSS virtual modules** - Stencil emits `./foo.css?tag=my-cmp&…`
 *     imports. `resolveId` rewrites these to `\0stencil-css:` virtual IDs;
 *     `load` reads the real file, runs it through any installed preprocessors,
 *     and returns `export default () => "…css…"`.
 *
 *  3. **Base-class inheritance** - when a component extends a class that does
 *     not itself extend `HTMLElement`, the custom-element registration breaks.
 *     The plugin intercepts every file the compiler resolves via `resolveImport`
 *     (during `transpileSync`), pre-transforms it with `transformAsBaseClass: true`
 *     so it gets `extends HTMLElement`, and caches the result. `resolveId` then
 *     redirects imports of those files to `\0stencil-base:` virtual modules so
 *     the bundler always sees the injected version - regardless of module-graph
 *     processing order.
 *
 *  4. **HMR** - Vite receives a custom `stencil:hmr` WebSocket event when a
 *     component file changes; other bundlers use the `module.hot` re-execution
 *     pattern. CSS changes are covered automatically by `addWatchFile`.
 *
 *  5. **spec-page module resolution** - `mode: 'spec-page'` (`stencilSpecPage`)
 *     redirects every bare `@stencil/core` import to `@stencil/core/testing` via
 *     `resolveId`, so the whole test file - not just compiler output - resolves
 *     to a single platform instance.
 *
 *  6. **Virtual global-stylesheet imports** - `@import "stencil-component-globals"`/
 *     `"stencil-hydrate"`/`"stencil-css-components"` resolve to generated stylesheets (see
 *     `global-css.ts`) via `resolveId`, or under Vite - which doesn't consult plugins for CSS
 *     `@import` - via an alias. The bundler then treats them like any other CSS. `load` registers
 *     their ingredient files (e.g. a component's `globalStyleUrl`) for watch mode;
 *     `handleHotUpdate` regenerates them for Vite HMR.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createFilter } from '@rollup/pluginutils';
import { validateHydrated } from '@stencil/core/compiler';
import { createUnplugin } from 'unplugin';
import type { BuildOverrides, HydratedFlag } from '@stencil/core/compiler';
import type { ModuleNode, ViteDevServer } from 'vite';

import { loadStencilConfig, stencilConfigToOverrides } from './config.js';
import { getRealCssPath, isStencilCss, loadStencilCss, resolveStencilCss } from './css.js';
import {
  createVirtualGlobalCss,
  getHydrateTagNames,
  virtualGlobalStylesheetAlias,
  virtualGlobalStylesheetAliasMap,
} from './global-css.js';
import {
  componentGlobalStyles,
  cssOnlyComponentFiles,
  docsRegistry,
  getRegistrySnapshot,
  getStencilCEM,
  refreshComponentDocs,
  rescanIfCssOnlyComponent,
  rescanNewCssOnlyComponents,
  scanCssOnlyDocsFile,
  scanDocs,
} from './project-scan.js';
import { resolveImportedTypes } from './resolve-types.js';
import { resolveSpecifier, transformStencil, transpileBaseClass } from './transform.js';
import type { StencilPluginOptions } from './options.js';

export { getStencilCEM } from './project-scan.js';

export const STENCIL_DOCS_ID = '@stencil/unplugin/docs';
const VIRTUAL_DOCS_PREFIX = '\0stencil-docs:';

// Null-byte prefix marks a virtual module - Rollup/Vite convention that
// prevents the ID from being treated as a real filesystem path.
const VIRTUAL_BASE_PREFIX = '\0stencil-base:';

// Mirrors the compiler's hasSignalsImport check in static-to-meta/import.ts.
const SIGNALS_IMPORT_RE = /from\s+['"]@stencil\/core\/signals['"]/;

// `this.resolve` isn't part of unplugin's cross-bundler `resolveId` context type
// (not every backend has it), but it is present on Vite/Rollup's real plugin
// context - the only framework `stencilSpecPage` runs through (`unpluginStencil.vite`).
interface RollupResolveContext {
  resolve(
    id: string,
    importer?: string,
    options?: { skipSelf?: boolean },
  ): Promise<{ id: string; external?: boolean } | null>;
}

/** The parts of Vite's dev server `handleHotUpdate` uses. */
interface HmrServer {
  ws: { send: (msg: unknown) => void };
  moduleGraph: {
    invalidateModule(
      mod: ModuleNode,
      seen?: Set<unknown>,
      timestamp?: number,
      isHmr?: boolean,
    ): void;
    getModuleById?(id: string): ModuleNode | undefined;
    getModulesByFile?(file: string): Set<ModuleNode> | undefined;
    idToModuleMap?: Map<string, ModuleNode>;
  };
}

const getModuleById = (server: HmrServer, id: string) =>
  server.moduleGraph.getModuleById?.(id) ?? server.moduleGraph.idToModuleMap?.get(id);

const invalidate = (server: HmrServer, mod: ModuleNode) =>
  server.moduleGraph.invalidateModule(mod, new Set(), Date.now(), true);

// Vite keys its module graph by forward-slash paths on every OS; Node's `path` uses `\` on Windows
const toViteFilePath = (filePath: string) => filePath.replace(/\\/g, '/');

const PLUGIN_NAME = '@stencil/unplugin';

interface Tapable<Args extends unknown[], Result = void> {
  tap(name: string, fn: (...args: Args) => Result): void;
}

interface LoaderContextDeps {
  resourcePath: string;
  addDependency(path: string): void;
  addContextDependency(path: string): void;
}

/** The parts of a webpack/rspack compiler used to keep the generated stylesheets current. */
interface BundlerCompiler {
  hooks: {
    watchRun: {
      tapPromise(
        name: string,
        fn: (compiler: { modifiedFiles?: ReadonlySet<string> }) => Promise<void>,
      ): void;
    };
    beforeCompile: { tapPromise(name: string, fn: () => Promise<void>): void };
    thisCompilation: Tapable<[compilation: unknown]>;
  };
  webpack: {
    NormalModule: {
      getCompilationHooks(compilation: unknown): {
        beforeLoaders?: Tapable<
          [loaders: unknown, module: { resource?: string }, loaderContext: LoaderContextDeps]
        >;
        loader?: Tapable<[loaderContext: LoaderContextDeps]>;
      };
    };
  };
}

export const unpluginStencil = createUnplugin(
  (options: StencilPluginOptions | undefined = {}, meta) => {
    const { framework } = meta;
    const filter = createFilter(
      options.include ?? [/\.tsx?$/],
      options.exclude ?? ['node_modules/**'],
    );

    // Vite auto-detects dev mode via configResolved; other bundlers use options.dev.
    let isDev = options.dev ?? false;

    // For Vite, configResolved sets this to config.root (more accurate than process.cwd()).
    // For other bundlers, process.cwd() is the fallback.
    let projectRoot = process.cwd();

    // Merged BUILD overrides from auto-detected stencil.config + explicit stencilConfig.
    // Populated in buildStart; explicit transpileOptions.buildOverrides takes precedence
    // over this in transformStencil.
    let configOverrides: BuildOverrides = {};

    // Tracks which source file owns which custom-element tag name, used by the
    // Vite HMR handler to send targeted `stencil:hmr` events.
    const fileToTagName = new Map<string, string>();

    // Reverse of fileToTagName - lets a linked-stylesheet change (which only knows its own
    // path, via cssFileToTagNames below) find the owning `.tsx` to re-derive docs from.
    const tagToFile = new Map<string, string>();

    // Maps CSS file paths → tag names that use them. A shared CSS file can be
    // used by multiple components, so this is a Set per file path.
    const cssFileToTagNames = new Map<string, Set<string>>();

    // Maps real CSS file path → virtual CSS module IDs (\0stencil-css:...).
    // Multiple components may share the same CSS file, each with their own
    // virtual module ID (different tag/encapsulation query params).
    const cssRealToVirtualIds = new Map<string, Set<string>>();

    function trackCssFile(realPath: string, tag: string, virtualId: string) {
      if (!cssFileToTagNames.has(realPath)) cssFileToTagNames.set(realPath, new Set());
      cssFileToTagNames.get(realPath)!.add(tag);
      if (!cssRealToVirtualIds.has(realPath)) cssRealToVirtualIds.set(realPath, new Set());
      cssRealToVirtualIds.get(realPath)!.add(virtualId);
    }

    // absPath → HTMLElement-injected JS. Populated during `transform` when
    // `transpileSync`'s resolveImport callback discovers a base-class file.
    // Rollup guarantees that resolveId for imports in a module's *output* fires
    // after the transform that produced them - so by the time the bundler asks
    // to resolve a base-class import, this map is already populated.
    const baseClassRegistry = new Map<string, string>();

    function registerBaseClass(absPath: string, rawCode: string) {
      if (baseClassRegistry.has(absPath)) return; // already processed this build
      baseClassRegistry.set(absPath, transpileBaseClass(rawCode, absPath, options));
    }

    // Validated once in buildStart from the detected/explicit stencil.config. `null` means
    // hydratedFlag is explicitly disabled - same meaning as the full compiler's config.
    let hydratedFlag: HydratedFlag | null = null;

    // Memoized so scanDocs() - a full project walk - runs at most once per build, however many
    // triggers ask for it.
    let projectScanPromise: Promise<void> | null = null;
    function ensureProjectScanned(): Promise<void> {
      if (!projectScanPromise) projectScanPromise = scanDocs(filter, options.docs === true);
      return projectScanPromise;
    }

    async function loadConfig() {
      const detected = await loadStencilConfig(projectRoot);
      // Merge: auto-detected config is the base; explicit stencilConfig overrides field-by-field.
      const merged = detected
        ? {
            ...detected,
            ...options.stencilConfig,
            compat: { ...detected.compat, ...options.stencilConfig?.compat },
          }
        : (options.stencilConfig ?? {});
      configOverrides = stencilConfigToOverrides(merged);
      hydratedFlag = validateHydrated({ hydratedFlag: merged.hydratedFlag });
    }
    // Some bundlers (rspack's `beforeCompile`) ask for the virtual stylesheets before `buildStart`.
    let stencilConfigLoaded: Promise<void> | null = null;

    // The generated virtual global stylesheets (see `global-css.ts`) - their dir is set by Vite's
    // `config` hook / rspack's plugin hook, otherwise in `buildStart`.
    const virtualCss = createVirtualGlobalCss(
      async () => {
        stencilConfigLoaded ??= loadConfig();
        await Promise.all([stencilConfigLoaded, ensureProjectScanned()]);
        return {
          componentGlobalStyles,
          cssOnlyComponentFiles,
          tagNames: getHydrateTagNames(docsRegistry.values()),
          hydratedFlag,
        };
      },
      () => isDev,
    );

    /**
     * webpack/rspack: they read the generated stylesheets straight from disk (`load` never runs for
     * them), so this (re)writes them before every compile and makes their modules depend on the
     * ingredient files - otherwise an ingredient edit neither triggers a watch-mode rebuild nor
     * invalidates the cached stylesheet module. `src/` too, so a newly added CSS-only component
     * does - not the whole project root, where build output would trigger rebuilds in a loop.
     * @param compiler the webpack/rspack compiler
     */
    function watchVirtualCssForCompiles(compiler: BundlerCompiler) {
      // before regenerating: a changed/added stylesheet may change which CSS-only components
      // exist. Here rather than `watchChange`, which isn't awaited before the compile starts.
      compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, async ({ modifiedFiles }) => {
        if (!virtualCss.started) return;
        for (const file of modifiedFiles ?? []) {
          await rescanIfCssOnlyComponent(file);
          // a file added to a watched directory is reported as the directory itself
          await rescanNewCssOnlyComponents(file);
        }
      });
      compiler.hooks.beforeCompile.tapPromise(PLUGIN_NAME, () =>
        virtualCss.forCompile(projectRoot),
      );
      compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
        const addIngredients = (resource: string | undefined, loaderContext: LoaderContextDeps) => {
          if (!resource || !virtualCss.isPath(resource)) return;
          for (const dep of virtualCss.deps) loaderContext.addDependency(dep);
          const srcDir = resolve(projectRoot, 'src');
          if (existsSync(srcDir)) loaderContext.addContextDependency(srcDir);
        };
        const hooks = compiler.webpack.NormalModule.getCompilationHooks(compilation);
        // webpack discards dependencies added in `loader` (the loader run starts a fresh list), and
        // hasn't set `resourcePath` yet in `beforeLoaders`; rspack only has `loader`
        if (hooks.beforeLoaders) {
          hooks.beforeLoaders.tap(PLUGIN_NAME, (_loaders, module, ctx) =>
            addIngredients(module.resource, ctx),
          );
        } else {
          hooks.loader?.tap(PLUGIN_NAME, (ctx) => addIngredients(ctx.resourcePath, ctx));
        }
      });
    }

    /**
     * Vite HMR: tell the client its docs changed, invalidating the docs virtual module.
     * @param server the dev server
     */
    function notifyDocsChanged(server: HmrServer) {
      const docsVirtualMod = getModuleById(server, VIRTUAL_DOCS_PREFIX);
      if (docsVirtualMod) invalidate(server, docsVirtualMod);
      server.ws.send({ type: 'custom', event: 'stencil:docs-update' });
    }

    /**
     * Vite HMR, `docs` only: refresh docs affected by a changed stylesheet - a CSS-only
     * component's own file, or a regular component's linked `styleUrl`.
     * @param file the changed stylesheet
     * @param server the dev server
     */
    async function refreshDocsForStylesheet(file: string, server: HmrServer) {
      try {
        const code = readFileSync(file, 'utf-8');
        if (code.includes('@component')) {
          // CSS-only components have no tracked tag / virtual-module entries (they're
          // never imported directly by anything) - handle their docs-registry refresh here.
          // No stencil:hmr to send; no JS component instance, only docs need refreshing.
          const prevSnapshot = JSON.stringify(getRegistrySnapshot());
          await scanCssOnlyDocsFile(file);
          if (JSON.stringify(getRegistrySnapshot()) !== prevSnapshot) notifyDocsChanged(server);
        } else {
          // A regular component's *linked* stylesheet (styleUrl) - re-derive docs from
          // each owning tag's `.tsx` source, the same as if that file had changed directly.
          let anyChanged = false;
          for (const tag of cssFileToTagNames.get(file) ?? []) {
            const ownerFile = tagToFile.get(tag);
            if (ownerFile && (await refreshComponentDocs(tag, ownerFile))) anyChanged = true;
          }
          if (anyChanged) notifyDocsChanged(server);
        }
      } catch {
        // stale docs are acceptable on parse error
      }
    }

    /**
     * Vite HMR: regenerate the virtual global stylesheets and hot-update whatever imports the ones
     * that changed. Vite doesn't watch them (under node_modules), so they're returned as HMR modules
     * - the documented pattern for hot-updating an untracked dependency.
     * @param file the changed file
     * @param server the dev server
     * @returns the modules to hot-update
     */
    async function hotUpdateVirtualCss(file: string, server: HmrServer): Promise<ModuleNode[]> {
      // with `docs`, refreshDocsForStylesheet already re-scanned CSS-only components
      if (virtualCss.started && !options.docs) await rescanIfCssOnlyComponent(file);
      const modules: ModuleNode[] = [];
      for (const written of await virtualCss.hotUpdate(file)) {
        for (const mod of server.moduleGraph.getModulesByFile?.(toViteFilePath(written)) ?? []) {
          invalidate(server, mod);
          modules.push(mod);
        }
      }
      return modules;
    }

    /**
     * Vite HMR: send `stencil:hmr` for every component the changed file belongs to.
     * @param file the changed file
     * @param server the dev server
     * @returns whether the file belongs to any component
     */
    async function hotUpdateComponents(file: string, server: HmrServer): Promise<boolean> {
      const tsxTag = fileToTagName.get(file);
      const tagNames = new Set<string>(cssFileToTagNames.get(file));
      if (tsxTag) tagNames.add(tsxTag);
      if (tagNames.size === 0) return false;

      // Invalidate every virtual CSS module that depends on this file so
      // Vite adds ?t=timestamp when re-serving the TSX - busts browser cache.
      for (const virtualId of cssRealToVirtualIds.get(file) ?? []) {
        const virtualMod = getModuleById(server, virtualId);
        if (virtualMod) invalidate(server, virtualMod);
      }
      // Update the docs registry and notify the client only when the CEM
      // actually changed (new/renamed prop, type update, JSDoc edit, etc.).
      // Pure implementation changes leave the CEM identical and fall through
      // to normal stencil:hmr so HMR is not disrupted.
      if (options.docs && tsxTag && (await refreshComponentDocs(tsxTag, file))) {
        notifyDocsChanged(server);
      }
      for (const tagName of tagNames) {
        server.ws.send({ type: 'custom', event: 'stencil:hmr', data: { tagName } });
      }
      return true;
    }

    return {
      name: '@stencil/unplugin',

      async buildStart() {
        // reloaded every build, so a watch-mode rebuild picks up stencil.config changes
        stencilConfigLoaded = loadConfig();
        await stencilConfigLoaded;
        if (options.docs) await ensureProjectScanned();
        virtualCss.useDefaultDir(projectRoot);
        // Vite never asks `resolveId` about CSS `@import`s, so generate up front if they're used -
        // and regenerate on a watch-mode rebuild, which reads them straight from disk
        if (framework === 'vite') await virtualCss.forCompile(projectRoot);
      },

      async resolveId(id, importer) {
        if (id === STENCIL_DOCS_ID) return VIRTUAL_DOCS_PREFIX;

        const virtualCssPath = await virtualCss.resolveId(id, importer);
        if (virtualCssPath) return virtualCssPath;

        // spec-page mode transpiles components against `@stencil/core/testing`'s
        // platform (hostRefs, mode chain, etc. - a separate module instance from
        // the real runtime). Any other file that imports the bare `@stencil/core`
        // specifier - a test file calling `setMode`, a helper, a mock - would
        // otherwise resolve to that other instance and silently stop working.
        // Redirecting here (like Jest's old `moduleNameMapper`) guarantees a
        // single platform instance for every file, not just compiler output.
        if (options.mode === 'spec-page' && id === '@stencil/core') {
          return (this as unknown as RollupResolveContext).resolve(
            '@stencil/core/testing',
            importer,
            { skipSelf: true },
          );
        }

        if (!importer) return null;

        const css = resolveStencilCss(id, importer);
        if (css) return css;

        if (baseClassRegistry.size > 0) {
          // Imports inside a virtual base-class module use the virtual ID as
          // importer - strip the prefix so resolveSpecifier works against the
          // real path on disk. This matters for multi-level inheritance chains.

          const realImporter = importer.startsWith(VIRTUAL_BASE_PREFIX)
            ? importer.slice(VIRTUAL_BASE_PREFIX.length)
            : importer;

          const abs = resolveSpecifier(id, realImporter);
          if (abs && baseClassRegistry.has(abs)) {
            return VIRTUAL_BASE_PREFIX + abs;
          }
        }

        return null;
      },

      transformInclude(id) {
        return filter(id.split('?')[0]);
      },

      async transform(code, id) {
        const cleanId = id.split('?')[0];

        if (!configOverrides.vdomSignals && SIGNALS_IMPORT_RE.test(code)) {
          configOverrides = { ...configOverrides, vdomSignals: true };
        }
        const result = await transformStencil(
          code,
          cleanId,
          options,
          isDev,
          framework,
          registerBaseClass,
          configOverrides,
        );
        if (result?.tagName) {
          fileToTagName.set(cleanId, result.tagName);
          tagToFile.set(result.tagName, cleanId);
        }
        if (result?.docsComponent && options.docs) {
          resolveImportedTypes(result.docsComponent, cleanId);
          docsRegistry.set(result.docsComponent.tag, result.docsComponent);
        }
        return result;
      },

      loadInclude(id) {
        return (
          id === VIRTUAL_DOCS_PREFIX ||
          isStencilCss(id) ||
          id.startsWith(VIRTUAL_BASE_PREFIX) ||
          virtualCss.isPath(id)
        );
      },

      async load(id) {
        if (id === VIRTUAL_DOCS_PREFIX) {
          return `export default ${JSON.stringify(getStencilCEM())}`;
        }
        if (virtualCss.isPath(id)) {
          const { code, deps } = await virtualCss.load(id);
          for (const dep of deps) this.addWatchFile(dep);
          return { code, map: null };
        }
        if (id.startsWith(VIRTUAL_BASE_PREFIX)) {
          const realPath = id.slice(VIRTUAL_BASE_PREFIX.length);
          this.addWatchFile(realPath); // re-invalidate this virtual module when the source changes
          return { code: baseClassRegistry.get(realPath) ?? '', map: null };
        }
        const realPath = getRealCssPath(id);
        const qIdx = id.indexOf('?');
        const tag = qIdx !== -1 ? new URLSearchParams(id.slice(qIdx + 1)).get('tag') : null;
        if (realPath) {
          this.addWatchFile(realPath);
          if (tag) trackCssFile(realPath, tag, id);
        }
        const cssResult = await loadStencilCss(id, isDev);
        if (cssResult) {
          if (tag) {
            for (const dep of cssResult.deps) {
              this.addWatchFile(dep);
              trackCssFile(dep, tag, id);
            }
          }
          return { code: cssResult.code, map: null };
        }
        return null;
      },

      // Watch mode for bundlers `load` regenerates for (Vite: `handleHotUpdate`; webpack/rspack:
      // `watchVirtualCssForCompiles`) - only a change in which CSS-only components exist needs a
      // re-scan first.
      async watchChange(id) {
        if (!['vite', 'webpack', 'rspack'].includes(framework) && virtualCss.started) {
          await rescanIfCssOnlyComponent(id);
        }
      },

      // webpack/rspack read the resolved stylesheets straight from disk (`load` never runs for
      // them), so (re)write them before every compile - watch-mode rebuilds included.
      webpack(compiler) {
        watchVirtualCssForCompiles(compiler);
      },

      // rspack's `css-loader` resolves `@import` natively, without asking `resolveId` - alias the
      // virtual imports to their generated stylesheets instead, like Vite.
      rspack(compiler) {
        virtualCss.useDefaultDir(compiler.options.context ?? projectRoot);
        const alias = compiler.options.resolve.alias;
        compiler.options.resolve.alias = {
          ...(alias && !Array.isArray(alias) ? alias : {}),
          ...virtualGlobalStylesheetAliasMap(virtualCss.dir),
        };
        watchVirtualCssForCompiles(compiler);
      },

      vite: {
        // Must run before Vite/rolldown's built-in TSX transform, which would
        // otherwise claim the file and emit react/jsx-dev-runtime imports.
        enforce: 'pre' as const,

        config(userConfig: { root?: string }, env: { command: string }) {
          // per command: a dev server and a build in the same project (e.g. an app plus
          // Storybook) generate differently-optimized CSS and mustn't overwrite each other's
          virtualCss.setDir(
            resolve(
              userConfig.root ?? process.cwd(),
              'node_modules',
              '.stencil',
              'virtual-css',
              env.command,
            ),
          );
          return { resolve: { alias: [virtualGlobalStylesheetAlias(virtualCss.dir)] } };
        },

        configResolved(config: { command: string; root: string }) {
          isDev = options.dev ?? config.command === 'serve';
          projectRoot = config.root;
        },

        // Vite only runs `handleHotUpdate` for changed files - a newly added CSS-only component
        // changes the generated stylesheets too
        configureServer(server: ViteDevServer) {
          server.watcher.on('add', async (file: string) => {
            if (!file.endsWith('.css')) return;
            if (options.docs) await refreshDocsForStylesheet(file, server);
            for (const mod of await hotUpdateVirtualCss(file, server))
              await server.reloadModule(mod);
          });
        },

        async handleHotUpdate({ file, server }: { file: string; server: HmrServer }) {
          if (options.docs && file.endsWith('.css')) await refreshDocsForStylesheet(file, server);
          const hmrModules = await hotUpdateVirtualCss(file, server);
          const isComponentFile = await hotUpdateComponents(file, server);
          if (!isComponentFile && hmrModules.length === 0) return undefined;
          return hmrModules;
        },
      },
    };
  },
);
