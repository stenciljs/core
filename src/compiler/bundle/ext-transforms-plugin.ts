import { hasError, isOutputTargetDistCollection, join, mergeIntoWith, normalizeFsPath, relative } from '@utils';
import type { Plugin } from 'rollup';

import type * as d from '../../declarations';
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
 * A Rollup plugin which bundles up some transformation of CSS imports as well
 * as writing some files to disk for the `DIST_COLLECTION` output target.
 *
 * @param config a user-supplied configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @returns a Rollup plugin which carries out the necessary work
 */
export const extTransformsPlugin = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Plugin => {
  return {
    name: 'extTransformsPlugin',

    /**
     * A custom function targeting the `transform` build hook in Rollup. See here for details:
     * https://rollupjs.org/guide/en/#transform
     *
     * Here we are ignoring the first argument (which contains the module's source code) and
     * only looking at the `id` argument. We use that `id` to get information about the module
     * in question from disk ourselves so that we can then do some transformations on it.
     *
     * @param _ an unused parameter (normally the code for a given module)
     * @param id the id of a module
     * @returns metadata for Rollup or null if no transformation should be done
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
        let cmpStyles: ComponentStyleMap | undefined = undefined;
        let cmp: d.ComponentCompilerMeta | undefined = undefined;
        const filePath = normalizeFsPath(id);
        const code = await compilerCtx.fs.readFile(filePath);
        if (typeof code !== 'string') {
          return null;
        }

        /**
         * add file to watch list if it is outside of the `srcDir` config path
         */
        if (config.watch && (id.startsWith('/') || id.startsWith('.')) && !id.startsWith(config.srcDir)) {
          compilerCtx.addWatchFile(id.split('?')[0]);
        }

        const pluginTransforms = await runPluginTransformsEsmImports(config, compilerCtx, buildCtx, code, filePath);

        if (data.tag) {
          cmp = buildCtx.components.find((c) => c.tagName === data.tag);
          const moduleFile = cmp && !cmp.isCollectionDependency && compilerCtx.moduleMap.get(cmp.sourceFilePath);

          if (moduleFile) {
            const collectionDirs = config.outputTargets.filter(isOutputTargetDistCollection);
            const relPath = relative(config.srcDir, pluginTransforms.id);

            // If we found a `moduleFile` in the module map above then we
            // should write the transformed CSS file (found in the return value
            // of `runPluginTransformsEsmImports`, above) to disk.
            await Promise.all(
              collectionDirs.map(async (outputTarget) => {
                const collectionPath = join(outputTarget.collectionDir, relPath);
                await compilerCtx.fs.writeFile(collectionPath, pluginTransforms.code);
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

        const cssTransformResults = await compilerCtx.worker.transformCssToEsm({
          file: pluginTransforms.id,
          input: pluginTransforms.code,
          tag: data.tag,
          encapsulation: data.encapsulation,
          mode: data.mode,
          sourceMap: config.sourceMap,
          minify: config.minifyCss,
          autoprefixer: config.autoprefixCss,
          docs: config.buildDocs,
        });

        /**
         * persist component styles for transformed stylesheet
         */
        if (cmpStyles) {
          cmpStyles.set(filePath, cssTransformResults.styleText);
        }

        // Set style docs
        if (cmp) {
          cmp.styleDocs ||= [];
          mergeIntoWith(cmp.styleDocs, cssTransformResults.styleDocs, (docs) => `${docs.name},${docs.mode}`);
        }

        // Track dependencies
        for (const dep of pluginTransforms.dependencies) {
          this.addWatchFile(dep);
          compilerCtx.addWatchFile(dep);
        }

        buildCtx.diagnostics.push(...pluginTransforms.diagnostics);
        buildCtx.diagnostics.push(...cssTransformResults.diagnostics);
        const didError = hasError(cssTransformResults.diagnostics) || hasError(pluginTransforms.diagnostics);
        if (didError) {
          this.error('Plugin CSS transform error');
        }

        const hasUpdatedStyle = buildCtx.stylesUpdated.some((s) => {
          return s.styleTag === data.tag && s.styleMode === data.mode && s.styleText === cssTransformResults.styleText;
        });

        /**
         * if the style has updated, compose all styles for the component
         */
        if (!hasUpdatedStyle && data.tag && data.mode) {
          const externalStyles = cmp?.styles?.[0]?.externalStyles;

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
                  .map((es) => cmpStyles.get(es.originalComponentPath) || cmpStyles.get(es.absolutePath))
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
              cssTransformResults.styleText;

          buildCtx.stylesUpdated.push({
            styleTag: data.tag,
            styleMode: data.mode,
            styleText,
          });
        }

        return {
          code: cssTransformResults.output,
          map: cssTransformResults.map,
          moduleSideEffects: false,
        };
      }

      return null;
    },
  };
};
