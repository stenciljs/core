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
 *  6. **Virtual global-stylesheet imports** - a real `.css` file containing
 *     `@import "stencil-globals"`/`"stencil-hydrate"`/`"stencil-css-components"`
 *     is rewritten in `transform`, mirroring the full compiler's own string
 *     substitution rather than asking the bundler's CSS engine to resolve them
 *     (see `global-css.ts`). `handleHotUpdate` tracks the reverse dependency so
 *     editing an ingredient file (e.g. a component's `globalStyleUrl`) invalidates
 *     the consumer stylesheet, not just files the bundler's own graph would catch.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createFilter } from '@rollup/pluginutils';
import {
  transpile,
  cmpMetaToDocsComponent,
  generateManifest,
  parseCssOnlyComponents,
  validateHydrated,
} from '@stencil/core/compiler';
import { createUnplugin } from 'unplugin';
import type {
  BuildOverrides,
  ComponentCompilerMeta,
  ComponentGlobalStyle,
  CustomElementsManifest,
  HydratedFlag,
  JsonDocsComponent,
} from '@stencil/core/compiler';
import type { ModuleNode } from 'vite';

import { loadStencilConfig, stencilConfigToOverrides } from './config.js';
import { getRealCssPath, isStencilCss, loadStencilCss, resolveStencilCss } from './css.js';
import {
  hasVirtualGlobalImport,
  invalidateGlobalCssFile,
  resolveVirtualGlobalImports,
} from './global-css.js';
import { resolveImportedTypes } from './resolve-types.js';
import { resolveSpecifier, transformStencil, transpileBaseClass } from './transform.js';
import type { GlobalCssProjectData } from './global-css.js';
import type { StencilPluginOptions } from './options.js';

export const STENCIL_DOCS_ID = '@stencil/unplugin/docs';
const VIRTUAL_DOCS_PREFIX = '\0stencil-docs:';

// Module-level registry so getStencilDocs() is callable from outside the plugin
// (e.g. from a Storybook preset running in Node.js).
const docsRegistry = new Map<string, JsonDocsComponent>();

// Module-level, alongside docsRegistry - the project-wide data `@import "stencil-globals"`/
// `"stencil-css-components"` need, populated by the same scanDocs() walk. Tag names for
// `@import "stencil-hydrate"` come from docsRegistry's keys directly.
const componentGlobalStyles: ComponentGlobalStyle[] = [];
const cssOnlyComponentFiles = new Set<string>();

/**
 * A snapshot of the whole docs registry's content, used to detect whether a CSS-only
 * component's docs changed after a re-scan. A `.css` file's tag(s) aren't known until after parsing
 *  - and it may define more than one; compares the whole registry rather than one entry.
 * Cheap in practice: only runs on file save
 *
 * @returns a string that changes whenever any registry entry's content does
 */
const getRegistrySnapshot = (): string =>
  JSON.stringify([...docsRegistry.entries()].sort(([a], [b]) => a.localeCompare(b)));

/**
 * Returns the current CEM. Only populated when `docs: true` is set.
 * @returns the current CEM, or an empty CEM if `docs: true` was not set.
 */
export function getStencilCEM(): CustomElementsManifest {
  return generateManifest({ components: [...docsRegistry.values()] });
}

const isTsSourceFile = (abs: string): boolean =>
  (abs.endsWith('.tsx') || abs.endsWith('.ts')) && !abs.endsWith('.d.ts');

const isCssFile = (abs: string): boolean => abs.endsWith('.css');

/**
 * Recursively collect file paths matching `matches` under `dir`, pruning
 * `node_modules` and hidden directories (`.git`, `.vite`, etc.) as it goes.
 *
 * `readdirSync(dir, { recursive: true })` can't prune during traversal - it
 * walks everything first and only lets the caller filter the flat result
 * afterward, which is disastrous under a symlink-heavy `node_modules` (e.g.
 * pnpm's `.pnpm` store, which flattens every dependency in the workspace) -
 * it can take minutes just to list, blocking `buildStart` the whole time.
 *
 * @param dir the directory to walk
 * @param matches predicate applied to each file's absolute path
 * @param out accumulator array of absolute file paths, mutated in place
 */
function collectFiles(dir: string, matches: (abs: string) => boolean, out: string[]): void {
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(abs, matches, out);
    } else if (entry.isFile() && matches(abs)) {
      out.push(abs);
    }
  }
}

/**
 * Parse a single `.css` file for CSS-only components (pure-CSS custom-element definitions
 * marked with a `@component` JSDoc tag - see `@stencil/core/compiler`'s `parseCssOnlyComponents`)
 * and register each one in the docs registry with `cssOnly: true`.
 * @param abs absolute path to the `.css` file
 */
async function scanCssOnlyDocsFile(abs: string): Promise<void> {
  let code: string;
  try {
    code = readFileSync(abs, 'utf-8');
  } catch {
    return;
  }
  // Cheap guard, same one parseCssOnlyComponents applies internally - skip the
  // postcss parse cost for the vast majority of .css files that aren't components.
  if (!code.includes('@component')) return;

  const { components } = await parseCssOnlyComponents(abs, code);
  if (components.length > 0) cssOnlyComponentFiles.add(abs);
  for (const item of components) {
    // No resolveImportedTypes call here - a CSS-only component's props are always literal
    // unions/primitives with empty `references`, never an imported TS type to resolve.
    docsRegistry.set(item.tagName, { ...cmpMetaToDocsComponent(item, abs), cssOnly: true });
  }
}

/**
 * Scan the project for component source files (`.tsx`/`.ts`) and CSS-only components
 * (`.css`), pre-populating the docs registry, `componentGlobalStyles`, and
 * `cssOnlyComponentFiles` - the project-wide data the virtual global-stylesheet imports need
 * (see `global-css.ts`), gathered eagerly so it doesn't depend on module-graph visitation order.
 * @param filter A function to filter which `.tsx`/`.ts` files should be included - not applied
 * to `.css` files, since the default `include` (`/\.tsx?$/`) would otherwise exclude all of them.
 * @returns A promise that resolves when the scan is complete.
 */
async function scanDocs(filter: (id: string) => boolean): Promise<void> {
  const cwd = process.cwd();
  const allFiles: string[] = [];
  collectFiles(cwd, (abs) => isTsSourceFile(abs) || isCssFile(abs), allFiles);

  const tsxFiles = allFiles.filter((abs) => isTsSourceFile(abs) && filter(abs));
  const cssFiles = allFiles.filter(isCssFile);

  await Promise.all([
    ...tsxFiles.map(async (abs) => {
      let code: string;
      try {
        code = readFileSync(abs, 'utf-8');
      } catch {
        return;
      }
      if (!/(@Component|@Prop|@State|@Event|@Method|@Watch|@Listen)\s*[(\s]/.test(code)) return;
      const result = await transpile(code, { file: abs, componentExport: 'customelement' });
      for (const item of (result.data ?? []) as ComponentCompilerMeta[]) {
        if (!item.tagName) continue;
        const component = cmpMetaToDocsComponent(item, abs);
        resolveImportedTypes(component, abs);
        docsRegistry.set(item.tagName, component);
        if (item.globalStyles?.length) componentGlobalStyles.push(...item.globalStyles);
      }
    }),
    ...cssFiles.map(scanCssOnlyDocsFile),
  ]);
}

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
      if (!projectScanPromise) projectScanPromise = scanDocs(filter);
      return projectScanPromise;
    }

    // Reverse dependency map for the virtual global-stylesheet imports
    // (e.g. `@import "stencil-globals"`/`"stencil-css-components"): a component's globalStyleUrl,
    // or a CSS-only-component file.
    const globalCssConsumers = new Map<string, Set<string>>();

    function trackGlobalCssDeps(consumerPath: string, deps: string[]) {
      for (const dep of deps) {
        if (!globalCssConsumers.has(dep)) globalCssConsumers.set(dep, new Set());
        globalCssConsumers.get(dep)!.add(consumerPath);
      }
    }

    return {
      name: '@stencil/unplugin',

      async buildStart() {
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
        if (options.docs) await ensureProjectScanned();
      },

      async resolveId(id, importer) {
        if (id === STENCIL_DOCS_ID) return VIRTUAL_DOCS_PREFIX;

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
        const cleanId = id.split('?')[0];
        return filter(cleanId) || isCssFile(cleanId);
      },

      async transform(code, id) {
        const cleanId = id.split('?')[0];

        if (isCssFile(cleanId)) {
          // Cheap guard - the vast majority of real .css files the bundler visits have nothing
          // to do with this feature, so skip the project scan/collection work entirely for them.
          if (!hasVirtualGlobalImport(code)) return null;
          await ensureProjectScanned();
          const data: GlobalCssProjectData = {
            componentGlobalStyles,
            cssOnlyComponentFiles,
            tagNames: new Set(docsRegistry.keys()),
            hydratedFlag,
          };
          const { code: resolvedCode, deps } = await resolveVirtualGlobalImports(code, data, isDev);
          trackGlobalCssDeps(cleanId, deps);
          for (const dep of deps) this.addWatchFile(dep);
          return { code: resolvedCode, map: null };
        }

        if (!configOverrides.vdomSignals && SIGNALS_IMPORT_RE.test(code)) {
          configOverrides = { ...configOverrides, vdomSignals: true };
        }
        const result = transformStencil(
          code,
          cleanId,
          options,
          isDev,
          framework,
          registerBaseClass,
          configOverrides,
        );
        if (result?.tagName) fileToTagName.set(cleanId, result.tagName);
        if (result?.docsComponent && options.docs) {
          resolveImportedTypes(result.docsComponent, cleanId);
          docsRegistry.set(result.docsComponent.tag, result.docsComponent);
        }
        return result;
      },

      loadInclude(id) {
        return id === VIRTUAL_DOCS_PREFIX || isStencilCss(id) || id.startsWith(VIRTUAL_BASE_PREFIX);
      },

      async load(id) {
        if (id === VIRTUAL_DOCS_PREFIX) {
          return `export default ${JSON.stringify(getStencilCEM())}`;
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

      vite: {
        // Must run before Vite/rolldown's built-in TSX transform, which would
        // otherwise claim the file and emit react/jsx-dev-runtime imports.
        enforce: 'pre' as const,

        configResolved(config: { command: string; root: string }) {
          isDev = options.dev ?? config.command === 'serve';
          projectRoot = config.root;
        },

        async handleHotUpdate({
          file,
          server,
        }: {
          file: string;
          server: {
            ws: { send: (msg: unknown) => void };
            moduleGraph: {
              invalidateModule(
                mod: ModuleNode,
                seen?: Set<unknown>,
                timestamp?: number,
                isHmr?: boolean,
              ): void;
              getModuleById?(id: string): ModuleNode | undefined;
              idToModuleMap?: Map<string, ModuleNode>;
            };
          };
        }) {
          // CSS-only components have no tracked tag / virtual-module entries (they're never
          // imported directly by anything) - handle their docs-registry refresh here.
          // No stencil:hmr to send; no JS component instance, only the docs registry needs refreshing.
          if (options.docs && file.endsWith('.css')) {
            try {
              const code = readFileSync(file, 'utf-8');
              if (code.includes('@component')) {
                const prevSnapshot = JSON.stringify(getRegistrySnapshot());
                await scanCssOnlyDocsFile(file);
                if (JSON.stringify(getRegistrySnapshot()) !== prevSnapshot) {
                  const docsVirtualMod =
                    server.moduleGraph.getModuleById?.(VIRTUAL_DOCS_PREFIX) ??
                    server.moduleGraph.idToModuleMap?.get(VIRTUAL_DOCS_PREFIX);
                  if (docsVirtualMod)
                    server.moduleGraph.invalidateModule(
                      docsVirtualMod,
                      new Set(),
                      Date.now(),
                      true,
                    );
                  server.ws.send({ type: 'custom', event: 'stencil:docs-update' });
                }
              }
            } catch {
              // stale docs are acceptable on parse error
            }
          }

          // A changed ingredient file (a component's globalStyleUrl, or a CSS-only-component file)
          // - the content was inlined as text in `transform`, never imported - so invalidate manually.
          // Returning the invalidated modules (rather than relying on the fallthrough default)
          // is the documented Vite pattern for hot-updating an implicit/untracked dependency.
          const hmrModules: ModuleNode[] = [];
          const globalCssConsumerPaths = globalCssConsumers.get(file);
          if (globalCssConsumerPaths) {
            invalidateGlobalCssFile(file);
            for (const consumerPath of globalCssConsumerPaths) {
              const consumerMod =
                server.moduleGraph.getModuleById?.(consumerPath) ??
                server.moduleGraph.idToModuleMap?.get(consumerPath);
              if (consumerMod) {
                server.moduleGraph.invalidateModule(consumerMod, new Set(), Date.now(), true);
                hmrModules.push(consumerMod);
              }
            }
          }

          // Collect all tag names affected by this file change
          const tsxTag = fileToTagName.get(file);
          const cssTagNames = cssFileToTagNames.get(file);
          const tagNames = new Set<string>(cssTagNames);
          if (tsxTag) tagNames.add(tsxTag);
          if (tagNames.size === 0) return hmrModules.length ? hmrModules : undefined;

          // Invalidate every virtual CSS module that depends on this file so
          // Vite adds ?t=timestamp when re-serving the TSX - busts browser cache.
          const virtualIds = cssRealToVirtualIds.get(file);
          if (virtualIds) {
            for (const virtualId of virtualIds) {
              const virtualMod =
                server.moduleGraph.getModuleById?.(virtualId) ??
                server.moduleGraph.idToModuleMap?.get(virtualId);
              if (virtualMod)
                server.moduleGraph.invalidateModule(virtualMod, new Set(), Date.now(), true);
            }
          }
          // Update the docs registry and notify the client only when the CEM
          // actually changed (new/renamed prop, type update, JSDoc edit, etc.).
          // Pure implementation changes leave the CEM identical and fall through
          // to normal stencil:hmr so HMR is not disrupted.
          if (options.docs && tsxTag) {
            let cemChanged = false;
            try {
              const prevSnapshot = JSON.stringify(docsRegistry.get(tsxTag));
              const code = readFileSync(file, 'utf-8');
              const result = await transpile(code, { file, componentExport: 'customelement' });
              for (const item of result.data ?? []) {
                if (!item.tagName) continue;
                const component = cmpMetaToDocsComponent(item, file);
                resolveImportedTypes(component, file);
                docsRegistry.set(item.tagName, component);
              }
              cemChanged = JSON.stringify(docsRegistry.get(tsxTag)) !== prevSnapshot;
            } catch {
              // stale docs are acceptable on transpile error
            }
            if (cemChanged) {
              const docsVirtualMod =
                server.moduleGraph.getModuleById?.(VIRTUAL_DOCS_PREFIX) ??
                server.moduleGraph.idToModuleMap?.get(VIRTUAL_DOCS_PREFIX);
              if (docsVirtualMod)
                server.moduleGraph.invalidateModule(docsVirtualMod, new Set(), Date.now(), true);
              server.ws.send({ type: 'custom', event: 'stencil:docs-update' });
            }
          }
          for (const tagName of tagNames) {
            server.ws.send({ type: 'custom', event: 'stencil:hmr', data: { tagName } });
          }
          return hmrModules;
        },
      },
    };
  },
);
