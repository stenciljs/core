import { readFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import type * as d from '@stencil/core';
import type { Plugin } from 'rolldown';

import {
  hasError,
  isOutputTargetCollection,
  isOutputTargetDocs,
  join,
  mergeIntoWith,
  normalizeFsPath,
  relative,
} from '../../utils';
import { runPluginTransformsEsmImports } from '../plugin/plugin';
import { getScopeId } from '../style/scope-css';
import { parseImportPath } from '../transformers/stencil-import-path';

/**
 * This keeps a map of all the component styles we've seen already so we can create
 * a correct state of all styles when we're doing a rebuild. This map helps by
 * storing the state of all styles as follows, e.g.:
 *
 * ```
 * {
 *  'cmp-a-$': {
 *   '/path/to/project/cmp-a.scss': 'button{color:red}',
 *   '/path/to/project/cmp-a.md.scss': 'button{color:blue}'
 * }
 * ```
 *
 * Whenever one of the files change, we can propagate a correct concatenated
 * version of all styles to the browser by setting `buildCtx.stylesUpdated`.
 */
type ComponentStyleMap = Map<string, string>;
const allCmpStyles = new Map<string, ComponentStyleMap>();

/**
 * A Rolldown plugin which bundles up some transformation of CSS imports as well
 * as writing some files to disk for the `STENCIL_META` output target.
 *
 * @param config a user-supplied configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @returns a Rolldown plugin which carries out the necessary work
 */
export const extTransformsPlugin = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Plugin => {
  let transformCount = 0;
  let cacheHits = 0;
  let firstTransformStart: number | null = null;
  let lastTransformEnd: number = 0;

  return {
    name: 'extTransformsPlugin',

    buildEnd() {
      if (config.logLevel === 'debug' && firstTransformStart !== null) {
        const totalElapsed = lastTransformEnd - firstTransformStart;
        const computed = transformCount - cacheHits;
        buildCtx.debug(
          `extTransformsPlugin: ${transformCount} stylesheets in ${totalElapsed.toFixed(1)}ms wall-clock` +
            (cacheHits > 0 ? ` (${computed} computed, ${cacheHits} from cache)` : ''),
        );
      }
    },

    /**
     * A custom function targeting the `transform` build hook in Rolldown. See here for details:
     * https://rolldownjs.org/guide/en/#transform
     *
     * Here we are ignoring the first argument (which contains the module's source code) and
     * only looking at the `id` argument. We use that `id` to get information about the module
     * in question from disk ourselves so that we can then do some transformations on it.
     *
     * @param _ an unused parameter (normally the code for a given module)
     * @param id the id of a module
     * @returns metadata for Rolldown or null if no transformation should be done
     */
    async transform(_, id) {
      if (/\0/.test(id)) {
        return null;
      }

      /**
       * Make sure compiler context has a registered worker. The interface suggests that it
       * potentially can be undefined, therefore check for it here.
       */
      if (!compilerCtx.worker) {
        return null;
      }

      // The `id` here was possibly previously updated using
      // `serializeImportPath` to annotate the filepath with various metadata
      // serialized to query-params. If that was done for this particular `id`
      // then the `data` prop will not be null.
      const { data } = parseImportPath(id);

      if (data != null) {
        const filePath = normalizeFsPath(id);

        // ---------------------------------------------------------------------------
        // Memoize the expensive SASS + Lightning CSS computation across output targets.
        // customElements, lazy, and hydrate all process the same ~N stylesheets;
        // caching here means only the first output target pays the full per-sheet
        // cost - subsequent targets hit the cache and complete in microseconds.
        //
        // NOTE: this cache is keyed by the raw annotated `id` which encodes the
        // file path plus component metadata (tag, mode, encapsulation). Entries are
        // invalidated in `invalidateRolldownCaches` whenever the source file or a
        // SASS dependency changes.
        // ---------------------------------------------------------------------------
        // Check before the populate block so we can distinguish cache hits from misses.
        const wasCached = compilerCtx.cssTransformCache.has(id);

        if (!wasCached) {
          const code = await compilerCtx.fs.readFile(filePath);
          if (typeof code !== 'string') {
            compilerCtx.cssTransformCache.set(id, null);
          } else {
            const pluginTransforms = await runPluginTransformsEsmImports(
              config,
              compilerCtx,
              buildCtx,
              code,
              filePath,
            );
            const cssInput = data.tag
              ? pluginTransforms.code
              : inlineRelativeCssUrlAssets(pluginTransforms.code, filePath);
            const cssTransformResults = await compilerCtx.worker.transformCssToEsm({
              file: pluginTransforms.id,
              input: cssInput,
              tag: data.tag,
              tags: buildCtx.components.map((c) => c.tagName),
              addTagTransformers: !!buildCtx.config.compat.additionalTagTransformers,
              encapsulation: data.encapsulation,
              mode: data.mode,
              sourceMap: config.sourceMap,
              minify: config.minifyCss,
              autoprefixer: config.autoprefixCss,
              // Extract docs if any docs output targets are configured
              docs: config.outputTargets.some(isOutputTargetDocs),
            });
            compilerCtx.cssTransformCache.set(id, {
              pluginTransformId: pluginTransforms.id,
              pluginTransformCode: pluginTransforms.code,
              pluginTransformDependencies: pluginTransforms.dependencies,
              pluginTransformDiagnostics: pluginTransforms.diagnostics,
              cssTransformOutput: cssTransformResults,
            });
          }
        }

        const cacheEntry = compilerCtx.cssTransformCache.get(id);
        if (wasCached) {
          cacheHits++;
        }
        if (cacheEntry == null) {
          return null;
        }

        // ---------------------------------------------------------------------------
        // Replay the cheap per-output-target side effects using the cached data.
        // None of these are CPU-bound; they're all O(1) Map or array operations.
        // ---------------------------------------------------------------------------

        /**
         * add file to watch list if it is outside of the `srcDir` config path
         */
        if (
          config.watch &&
          (id.startsWith('/') || id.startsWith('.')) &&
          !id.startsWith(config.srcDir)
        ) {
          compilerCtx.addWatchFile(id.split('?')[0]);
        }

        if (firstTransformStart === null) {
          firstTransformStart = performance.now();
        }

        let cmpStyles: ComponentStyleMap | undefined = undefined;
        let cmp: d.ComponentCompilerMeta | undefined = undefined;

        if (data.tag) {
          cmp = buildCtx.components.find((c) => c.tagName === data.tag);
          const moduleFile =
            cmp && !cmp.isCollectionDependency && compilerCtx.moduleMap.get(cmp.sourceFilePath);

          if (moduleFile) {
            const collectionDirs = config.outputTargets.filter(isOutputTargetCollection);
            const relPath = relative(config.srcDir, cacheEntry.pluginTransformId);

            // Write the transformed CSS file to any collection output target dirs.
            // This uses cached data so it only does I/O, no re-computation.
            await Promise.all(
              collectionDirs.map(async (outputTarget) => {
                const collectionPath = join(outputTarget.dir!, relPath);
                await compilerCtx.fs.writeFile(collectionPath, cacheEntry.pluginTransformCode);
              }),
            );
          }

          /**
           * initiate map for component styles
           */
          const scopeId = getScopeId(data.tag, data.mode);
          if (!allCmpStyles.has(scopeId)) {
            allCmpStyles.set(scopeId, new Map());
          }
          cmpStyles = allCmpStyles.get(scopeId);
        }

        transformCount++;
        lastTransformEnd = performance.now();

        /**
         * persist component styles for transformed stylesheet
         */
        if (cmpStyles) {
          cmpStyles.set(filePath, cacheEntry.cssTransformOutput.styleText);
        }

        // Set style docs
        if (cmp) {
          cmp.styleDocs ||= [];
          mergeIntoWith(
            cmp.styleDocs,
            cacheEntry.cssTransformOutput.styleDocs,
            (docs) => `${docs.name},${docs.mode}`,
          );
        }

        // Track dependencies
        for (const dep of cacheEntry.pluginTransformDependencies) {
          this.addWatchFile(dep);
          compilerCtx.addWatchFile(dep);
        }

        buildCtx.diagnostics.push(...cacheEntry.pluginTransformDiagnostics);
        buildCtx.diagnostics.push(...cacheEntry.cssTransformOutput.diagnostics);
        const didError =
          hasError(cacheEntry.cssTransformOutput.diagnostics) ||
          hasError(cacheEntry.pluginTransformDiagnostics);
        if (didError) {
          this.error('Plugin CSS transform error');
        }

        /**
         * if the style has updated, compose all styles for the component
         */
        if (data.tag && data.mode) {
          // Find the style entry for the current mode (not always styles[0] which is the default mode).
          const currentModeStyle = cmp?.styles?.find((s) => s.modeName === data.mode);
          const externalStyles = currentModeStyle?.externalStyles;

          /**
           * if component has external styles, use a list to keep the order to which
           * styles are applied.
           */
          const styleText = cmpStyles
            ? externalStyles
              ? /**
                 * attempt to find the original `filePath` key through `originalComponentPath`
                 * and `absolutePath` as path can differ based on how Stencil is installed
                 * e.g. through `npm link` or `npm install`
                 */
                externalStyles
                  .map(
                    (es) =>
                      cmpStyles.get(es.originalComponentPath) || cmpStyles.get(es.absolutePath),
                  )
                  .join('\n')
              : /**
                 * if `externalStyles` is not defined, then created the style text in the
                 * order of which the styles were compiled.
                 */
                [...cmpStyles.values()].join('\n')
            : /**
               * if `cmpStyles` is not defined, then use the style text from the transform
               * as it is not connected to a component.
               */
              cacheEntry.cssTransformOutput.styleText;

          // Only push to stylesUpdated if the CSS actually changed since the
          // last build. Without this check, every rebuild re-pushes all 90+
          // component stylesheets even when only a .tsx file changed, causing
          // the HMR client to re-inject every style on every save.
          const scopeId = getScopeId(data.tag, data.mode);
          const prevText = compilerCtx.prevStylesMap.get(scopeId);
          const alreadyQueued = buildCtx.stylesUpdated.some(
            (s) => s.styleTag === data.tag && s.styleMode === data.mode,
          );
          if (!alreadyQueued && styleText !== prevText) {
            compilerCtx.prevStylesMap.set(scopeId, styleText);
            buildCtx.stylesUpdated.push({
              styleTag: data.tag,
              styleMode: data.mode,
              styleText,
            });
          }
        }

        return {
          code: cacheEntry.cssTransformOutput.output,
          map: cacheEntry.cssTransformOutput.map,
          // Tagged component styles - e.g. via styleUrl - are side-effect-free but
          // untagged CSS files - a plain third-party `import './foo.css' -` self-injects
          // on import per `generateTransformCssToEsm`, so it must not
          // be marked side-effect-free or injection gets treeshaken away unexecuted.
          moduleSideEffects: cacheEntry.cssTransformOutput.moduleSideEffects ?? false,
        };
      }

      return null;
    },
  };
};

/**
 * 3rd-party stylesheets with relative `url(./font.ttf)` (font-face `src`, a background-image, ...)
 * have nowhere to resolve that path once this CSS is self-injected as a CSSStyleSheet:
 * there's no bundler output location for it to be relative *to*.
 * Inlining the referenced file as a `data:` URI sidesteps needing one - no separate asset
 * to serve, works the same regardless of how/where the final bundle is deployed.
 */
const CSS_URL_RE = /url\(\s*(['"]?)([^'"()]+)\1\s*\)/g;

const CSS_URL_ASSET_MIME_TYPES: Record<string, string> = {
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  eot: 'application/vnd.ms-fontobject',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

// 3rd party css import handling: inline relative url() assets to avoid needing a separate asset to serve
const inlineRelativeCssUrlAssets = (cssText: string, cssFilePath: string): string =>
  cssText.replace(CSS_URL_RE, (original, _quote: string, url: string) => {
    // already a data: URI, an absolute URL, or root-relative - nothing to inline
    if (/^(data:|[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(url)) {
      return original;
    }
    const cleanUrl = url.split(/[?#]/)[0];
    const ext = cleanUrl.split('.').pop()?.toLowerCase();
    const mimeType = ext && CSS_URL_ASSET_MIME_TYPES[ext];
    if (!mimeType) {
      return original;
    }
    try {
      const assetPath = resolvePath(dirname(cssFilePath), cleanUrl);
      const base64 = readFileSync(assetPath).toString('base64');
      return `url("data:${mimeType};base64,${base64}")`;
    } catch {
      // referenced file doesn't exist, or isn't readable - leave the original reference as-is
      // rather than failing the whole build over one unresolved asset
      return original;
    }
  });
