import type * as d from '@stencil/core';

import { buildError, join, normalizePath, STYLE_EXT } from '../../utils';
import { runPluginTransforms } from '../plugin/plugin';
import { createCssOnlyComponentMeta } from './css-component-meta';
import { parseCssComponentFile } from './parse-css-component';

/**
 * Discover "CSS-only components" - pure-CSS custom-element definitions marked with a
 * `@component` JSDoc tag - by scanning style files (`.css`, plus any `STYLE_EXT` preprocessor
 * extension - `.scss`, `.sass`, `.less`, `.styl`, `.stylus`, `.pcss`) under `srcDir`, and
 * populate `buildCtx.cssOnlyComponents`. Non-`.css` files are run through the configured
 * `plugins` (e.g. `@stencil/sass`) first, the same pipeline a real component's `styleUrl` goes
 * through, before being parsed for `@component` definitions.

 * @param config the validated Stencil config
 * @param compilerCtx the compiler context, used for the cross-build discovery cache
 * @param buildCtx the current build context
 * @returns `true` if anything about the discovered set changed since the last build
 * (added/removed/renamed a tag, or changed a tag's docs/properties/attributes) - callers use this
 * to force `components.d.ts` / docs regeneration on watch rebuilds that would otherwise skip it.
 */
export const discoverCssOnlyComponents = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<boolean> => {
  if (config.enableCssOnlyComponents === false || typeof config.sys.glob !== 'function') {
    buildCtx.cssOnlyComponents = [];
    return false;
  }

  const cache = compilerCtx.cssOnlyComponentsCache;
  const previousSignature = computeSignature(cache);
  const isRelevantCssFile = makeIsRelevantCssFile(config);

  const canSkipFullScan = buildCtx.isRebuild && !buildCtx.requiresFullBuild;

  if (canSkipFullScan) {
    const changed = [...buildCtx.filesChanged, ...buildCtx.filesAdded].filter(isRelevantCssFile);
    const deleted = buildCtx.filesDeleted.filter(isRelevantCssFile);

    if (changed.length === 0 && deleted.length === 0) {
      buildCtx.cssOnlyComponents = resolveCollisions(buildCtx, flattenCache(cache));
      return false;
    }

    for (const filePath of deleted) {
      cache.delete(filePath);
    }
    await scanFiles(config, compilerCtx, buildCtx, cache, changed);
  } else {
    cache.clear();
    const relPaths = await config.sys.glob(`**/*.{${STYLE_EXT.join(',')}}`, {
      cwd: config.srcDir,
      nodir: true,
    });
    const absPaths = relPaths.map((relPath) => normalizePath(join(config.srcDir, relPath)));
    await scanFiles(config, compilerCtx, buildCtx, cache, absPaths);
  }

  buildCtx.cssOnlyComponents = resolveCollisions(buildCtx, flattenCache(cache));

  return computeSignature(cache) !== previousSignature;
};

const makeIsRelevantCssFile = (config: d.ValidatedConfig) => {
  const srcDir = normalizePath(config.srcDir);
  return (filePath: string): boolean => {
    const normalized = normalizePath(filePath);
    const ext = normalized.toLowerCase().split('.').pop();
    return !!ext && STYLE_EXT.includes(ext) && normalized.startsWith(srcDir);
  };
};

const scanFiles = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  cache: Map<string, d.ComponentCompilerMeta[]>,
  filePaths: string[],
): Promise<void> => {
  await Promise.all(
    filePaths.map(async (filePath) => {
      compilerCtx.addWatchFile(filePath);

      const cssText = await loadCssOnlyComponentSource(config, compilerCtx, buildCtx, filePath);
      if (cssText === null) {
        cache.delete(filePath);
        return;
      }

      const { defs, diagnostics } = await parseCssComponentFile(filePath, cssText);
      buildCtx.diagnostics.push(...diagnostics);

      if (defs.length === 0) {
        cache.delete(filePath);
        return;
      }
      cache.set(filePath, defs.map(createCssOnlyComponentMeta));
    }),
  );
};

/**
 * Load a CSS-only component source file's text. A plain `.css` file is read as-is; any other
 * `STYLE_EXT` extension is run through the configured `plugins` first (e.g. `@stencil/sass`
 * compiling `.scss` to CSS) - the same pipeline `collectCssOnlyComponentStyles` uses to emit
 * this file's CSS, so discovery parses exactly what gets shipped.
 *
 * @param config the validated Stencil config
 * @param compilerCtx the compiler context, used to read the file and register watch files
 * @param buildCtx the current build context, used for plugin transform diagnostics
 * @param filePath absolute path to the source file to load
 * @returns the (possibly preprocessed) CSS text, or `null` if the file couldn't be loaded
 */
const loadCssOnlyComponentSource = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  filePath: string,
): Promise<string | null> => {
  if (filePath.toLowerCase().endsWith('.css')) {
    try {
      return await compilerCtx.fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  const transformResults = await runPluginTransforms(config, compilerCtx, buildCtx, filePath);
  if (!transformResults) {
    return null;
  }
  if (typeof transformResults === 'string') {
    return transformResults;
  }
  for (const dep of transformResults.dependencies ?? []) {
    compilerCtx.addWatchFile(dep);
  }
  return transformResults.code ?? null;
};

const flattenCache = (cache: Map<string, d.ComponentCompilerMeta[]>): d.ComponentCompilerMeta[] =>
  Array.from(cache.values()).flat();

/**
 * Drop CSS-only components whose tag collides with a real component, or with another
 * CSS-only component - first (cache-insertion-order-stable) definition wins.
 * @param buildCtx the current build context, used for diagnostics and real component tags
 * @param metas the flattened, discovered CSS-only component metas to de-collide
 * @returns the collision-free subset of `metas`
 */
const resolveCollisions = (
  buildCtx: d.BuildCtx,
  metas: d.ComponentCompilerMeta[],
): d.ComponentCompilerMeta[] => {
  const realComponentsByTag = new Map(buildCtx.components.map((c) => [c.tagName, c]));
  const seen = new Map<string, d.ComponentCompilerMeta>();
  const result: d.ComponentCompilerMeta[] = [];

  for (const meta of metas) {
    const realCmp = realComponentsByTag.get(meta.tagName);
    if (realCmp) {
      const err = buildError(buildCtx.diagnostics);
      err.messageText = `CSS-only component "${meta.tagName}" (${meta.sourceFilePath}) collides with an existing component defined in ${realCmp.sourceFilePath}. The real component wins; the CSS-only definition is ignored.`;
      err.absFilePath = meta.sourceFilePath;
      continue;
    }

    const existing = seen.get(meta.tagName);
    if (existing) {
      const err = buildError(buildCtx.diagnostics);
      err.messageText = `Duplicate CSS-only component tag "${meta.tagName}" found in both ${existing.sourceFilePath} and ${meta.sourceFilePath}. The first definition wins.`;
      err.absFilePath = meta.sourceFilePath;
      continue;
    }

    seen.set(meta.tagName, meta);
    result.push(meta);
  }

  return result;
};

/**
 * A cheap signature of the discovery cache's content, used to detect whether the set of
 * CSS-only components (or any one's docs/properties/attributes) changed since the last build.
 * @param cache the discovery cache to summarize
 * @returns a string that changes whenever the cache's content does
 */
const computeSignature = (cache: Map<string, d.ComponentCompilerMeta[]>): string => {
  const all = flattenCache(cache).sort((a, b) => a.tagName.localeCompare(b.tagName));
  return JSON.stringify(
    all.map((m) => ({
      tag: m.tagName,
      docs: m.docs,
      properties: m.properties.map((p) => ({
        name: p.attribute,
        type: p.complexType.original,
        docs: p.docs.text,
      })),
      styleDocs: m.styleDocs,
    })),
  );
};
