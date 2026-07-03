/**
 * Unplugin factory for @stencil/unplugin.
 *
 * Wires together four concerns into a single plugin that works across Vite,
 * Rollup, webpack, rspack, and bun:
 *
 *  1. **Component transform** — `transform` drives `transpileSync` on every
 *     `.tsx`/`.ts` file that carries Stencil decorators, producing
 *     `customelement` output (self-registering class + `defineCustomElement`).
 *
 *  2. **CSS virtual modules** — Stencil emits `./foo.css?tag=my-cmp&…`
 *     imports. `resolveId` rewrites these to `\0stencil-css:` virtual IDs;
 *     `load` reads the real file, runs it through any installed preprocessors,
 *     and returns `export default () => "…css…"`.
 *
 *  3. **Base-class inheritance** — when a component extends a class that does
 *     not itself extend `HTMLElement`, the custom-element registration breaks.
 *     The plugin intercepts every file the compiler resolves via `resolveImport`
 *     (during `transpileSync`), pre-transforms it with `transformAsBaseClass: true`
 *     so it gets `extends HTMLElement`, and caches the result. `resolveId` then
 *     redirects imports of those files to `\0stencil-base:` virtual modules so
 *     the bundler always sees the injected version — regardless of module-graph
 *     processing order.
 *
 *  4. **HMR** — Vite receives a custom `stencil:hmr` WebSocket event when a
 *     component file changes; other bundlers use the `module.hot` re-execution
 *     pattern. CSS changes are covered automatically by `addWatchFile`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createFilter } from '@rollup/pluginutils';
import { transpile, cmpMetaToDocsComponent, generateManifest } from '@stencil/core/compiler';
import { createUnplugin } from 'unplugin';
import type {
  BuildOverrides,
  CustomElementsManifest,
  JsonDocsComponent,
} from '@stencil/core/compiler';

import { loadStencilConfig, stencilConfigToOverrides } from './config.js';
import { getRealCssPath, isStencilCss, loadStencilCss, resolveStencilCss } from './css.js';
import { resolveImportedTypes } from './resolve-types.js';
import { resolveSpecifier, transformStencil, transpileBaseClass } from './transform.js';
import type { StencilPluginOptions } from './options.js';

export const STENCIL_DOCS_ID = '@stencil/unplugin/docs';
const VIRTUAL_DOCS_PREFIX = '\0stencil-docs:';

// Module-level registry so getStencilDocs() is callable from outside the plugin
// (e.g. from a Storybook preset running in Node.js).
const docsRegistry = new Map<string, JsonDocsComponent>();

/**
 * Returns the current CEM. Only populated when `docs: true` is set.
 * @returns the current CEM, or an empty CEM if `docs: true` was not set.
 */
export function getStencilCEM(): CustomElementsManifest {
  return generateManifest({ components: [...docsRegistry.values()] });
}

/**
 * Scan the project for component source files and pre-populate the docs registry.
 * @param filter A function to filter which files should be included.
 * @returns A promise that resolves when the scan is complete.
 */
async function scanDocs(filter: (id: string) => boolean): Promise<void> {
  const cwd = process.cwd();
  let entries: string[];
  try {
    entries = readdirSync(cwd, { recursive: true, encoding: 'utf-8' }) as string[];
  } catch {
    return;
  }

  const files = entries
    .filter((rel) => (rel.endsWith('.tsx') || rel.endsWith('.ts')) && !rel.endsWith('.d.ts'))
    .map((rel) => join(cwd, rel))
    .filter((abs) => filter(abs));

  await Promise.all(
    files.map(async (abs) => {
      let code: string;
      try {
        code = readFileSync(abs, 'utf-8');
      } catch {
        return;
      }
      if (!/(@Component|@Prop|@State|@Event|@Method|@Watch|@Listen)\s*[(\s]/.test(code)) return;
      const result = await transpile(code, { file: abs, componentExport: 'customelement' });
      for (const item of result.data ?? []) {
        if (!item.tagName) continue;
        const component = cmpMetaToDocsComponent(item, abs);
        resolveImportedTypes(component, abs);
        docsRegistry.set(item.tagName, component);
      }
    }),
  );
}

// Null-byte prefix marks a virtual module — Rollup/Vite convention that
// prevents the ID from being treated as a real filesystem path.
const VIRTUAL_BASE_PREFIX = '\0stencil-base:';

// Mirrors the compiler's hasSignalsImport check in static-to-meta/import.ts.
const SIGNALS_IMPORT_RE = /from\s+['"]@stencil\/core\/signals['"]/;

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

    // Maps CSS dependency paths (including Sass @use/@import) → tag name so
    // changes to imported partials also trigger HMR for the component.
    const cssFileToTagName = new Map<string, string>();

    // Maps real CSS file path → virtual CSS module ID (\0stencil-css:...) so
    // handleHotUpdate can locate and invalidate the right module in the graph.
    const cssRealToVirtualId = new Map<string, string>();

    // absPath → HTMLElement-injected JS. Populated during `transform` when
    // `transpileSync`'s resolveImport callback discovers a base-class file.
    // Rollup guarantees that resolveId for imports in a module's *output* fires
    // after the transform that produced them — so by the time the bundler asks
    // to resolve a base-class import, this map is already populated.
    const baseClassRegistry = new Map<string, string>();

    function registerBaseClass(absPath: string, rawCode: string) {
      if (baseClassRegistry.has(absPath)) return; // already processed this build
      baseClassRegistry.set(absPath, transpileBaseClass(rawCode, absPath, options));
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
        if (options.docs) await scanDocs(filter);
      },

      resolveId(id, importer) {
        if (id === STENCIL_DOCS_ID) return VIRTUAL_DOCS_PREFIX;
        if (!importer) return null;

        const css = resolveStencilCss(id, importer);
        if (css) return css;

        if (baseClassRegistry.size > 0) {
          // Imports inside a virtual base-class module use the virtual ID as
          // importer — strip the prefix so resolveSpecifier works against the
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

      transform(code, id) {
        const cleanId = id.split('?')[0];
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
          if (tag) cssFileToTagName.set(realPath, tag);
          cssRealToVirtualId.set(realPath, id);
        }
        const cssResult = await loadStencilCss(id, isDev);
        if (cssResult) {
          if (tag) {
            for (const dep of cssResult.deps) {
              this.addWatchFile(dep);
              cssFileToTagName.set(dep, tag);
              cssRealToVirtualId.set(dep, id);
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
                mod: unknown,
                seen?: Set<unknown>,
                timestamp?: number,
                isHmr?: boolean,
              ): void;
              getModuleById?(id: string): unknown;
              idToModuleMap?: Map<string, unknown>;
            };
          };
        }) {
          const tagName = fileToTagName.get(file) ?? cssFileToTagName.get(file);
          if (!tagName) return;
          // Invalidate the virtual CSS module (\0stencil-css:...) so Vite
          // rewrites its import URL with ?t=timestamp when serving the
          // re-fetched TSX — prevents the browser's ESM cache serving stale CSS.
          const virtualId = cssRealToVirtualId.get(file);
          if (virtualId) {
            const virtualMod =
              server.moduleGraph.getModuleById?.(virtualId) ??
              server.moduleGraph.idToModuleMap?.get(virtualId);
            if (virtualMod)
              server.moduleGraph.invalidateModule(virtualMod, new Set(), Date.now(), true);
          }
          // Update the docs registry and notify the client only when the CEM
          // actually changed (new/renamed prop, type update, JSDoc edit, etc.).
          // Pure implementation changes leave the CEM identical and fall through
          // to normal stencil:hmr so HMR is not disrupted.
          if (options.docs && fileToTagName.has(file)) {
            let cemChanged = false;
            try {
              const prevSnapshot = JSON.stringify(docsRegistry.get(tagName));
              const code = readFileSync(file, 'utf-8');
              const result = await transpile(code, { file, componentExport: 'customelement' });
              for (const item of result.data ?? []) {
                if (!item.tagName) continue;
                const component = cmpMetaToDocsComponent(item, file);
                resolveImportedTypes(component, file);
                docsRegistry.set(item.tagName, component);
              }
              cemChanged = JSON.stringify(docsRegistry.get(tagName)) !== prevSnapshot;
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
          server.ws.send({ type: 'custom', event: 'stencil:hmr', data: { tagName } });
          return [];
        },
      },
    };
  },
);
