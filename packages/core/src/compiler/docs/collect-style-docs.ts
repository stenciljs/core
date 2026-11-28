import type * as d from '@stencil/core';

import { hasError, mergeIntoWith, normalizeFsPath } from '../../utils';
import { transformStylesheet } from '../style/transform-stylesheet';
import { parseImportPath } from '../transformers/stencil-import-path';

/**
 * Populate `styleDocs` for every component from its external stylesheets. Stylesheets a bundler
 * has already transformed are read from `compilerCtx.cssTransformCache`; the rest are transformed
 * here, so style docs don't depend on a bundling output target having run.
 *
 * @param config the configuration associated with the current Stencil task run
 * @param compilerCtx the current compiler context
 * @param buildCtx the build context for the current Stencil task run
 */
export const collectStyleDocs = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  const cached = new Map<string, d.CssTransformCacheEntry>();
  for (const [id, entry] of compilerCtx.cssTransformCache) {
    const { data } = parseImportPath(id);
    if (entry && data?.tag) {
      cached.set(cacheKey(id, data.tag, data.mode), entry);
    }
  }

  const collect = async (
    cmp: d.ComponentCompilerMeta,
    mode: string,
    externalStyle: d.ExternalStyleCompiler,
  ) => {
    let entry =
      cached.get(cacheKey(externalStyle.absolutePath, cmp.tagName, mode)) ??
      cached.get(cacheKey(externalStyle.originalComponentPath, cmp.tagName, mode));

    if (!entry) {
      const data = { tag: cmp.tagName, mode, encapsulation: cmp.encapsulation };
      const id = `${externalStyle.absolutePath}?${new URLSearchParams(data)}`;
      const transformed = await transformStylesheet(config, compilerCtx, buildCtx, id, data);
      if (!transformed) {
        return;
      }
      entry = transformed;

      const diagnostics = [
        ...entry.pluginTransformDiagnostics,
        ...entry.cssTransformOutput.diagnostics,
      ];
      buildCtx.diagnostics.push(...diagnostics);
      if (hasError(diagnostics)) {
        // don't let a rebuild read the failure back from the cache without reporting it
        compilerCtx.cssTransformCache.delete(id);
      }
      for (const dep of entry.pluginTransformDependencies) {
        compilerCtx.addWatchFile(dep);
      }
    }

    cmp.styleDocs ||= [];
    mergeIntoWith(
      cmp.styleDocs,
      entry.cssTransformOutput.styleDocs,
      (docs) => `${docs.name},${docs.mode}`,
    );
  };

  await Promise.all(
    buildCtx.components
      .filter((cmp) => !cmp.internal && !cmp.isCollectionDependency)
      .flatMap((cmp) =>
        (cmp.styles ?? []).flatMap((style) =>
          (style.externalStyles ?? []).map((externalStyle) =>
            collect(cmp, style.modeName, externalStyle),
          ),
        ),
      ),
  );
};

const cacheKey = (path: string, tag: string, mode: string | undefined) =>
  `${normalizeFsPath(path)}\n${tag}\n${mode}`;
