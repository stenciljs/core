import type * as d from '@stencil/core';

import { normalizePath } from '../../utils';
import { runPluginTransforms } from '../plugin/plugin';
import { optimizeCss } from './optimize-css';

const STENCIL_GLOBALS_RE = /@import\s+(?:url\()?\s*['"]stencil-globals['"]\s*\)?\s*;?/g;
const STENCIL_HYDRATE_RE = /@import\s+(?:url\()?\s*['"]stencil-hydrate['"]\s*\)?\s*;?/g;

export const hasStencilGlobalsImport = (css: string): boolean => css.includes('stencil-globals');
export const hasStencilHydrateImport = (css: string): boolean => css.includes('stencil-hydrate');

/**
 * Generate the FOUC-prevention CSS for all components in the build.
 * Mirrors the CSS injected dynamically by bootstrap-loader, but produced at build time
 * so it can be embedded in a static stylesheet via `@import "stencil-hydrate"`.
 * @param config the Stencil configuration
 * @param buildCtx the current build context, used to get the list of components in the build
 * @returns the generated CSS string to replace `@import "stencil-hydrate"` with
 */
export const generateHydrateCss = (config: d.ValidatedConfig, buildCtx: d.BuildCtx): string => {
  const h = config.hydratedFlag;
  if (!h) return ''; // hydratedFlag: null means explicitly disabled

  const tags = buildCtx.components.map((c) => c.tagName).sort();
  if (!tags.length) return '';

  const selector = h.selector === 'attribute' ? `[${h.name}]` : `.${h.name}`;
  const initial =
    h.initialValue === '' || h.initialValue == null ? '' : `{${h.property}:${h.initialValue}}`;
  const hydrated =
    h.hydratedValue === '' || h.hydratedValue == null
      ? ''
      : `${selector}{${h.property}:${h.hydratedValue}}`;

  return tags.join(',') + initial + hydrated;
};

/**
 * Replace `@import "stencil-hydrate"` in CSS with the generated FOUC-prevention styles.
 * @param css the CSS string to process
 * @param config the Stencil configuration
 * @param buildCtx the current build context, used to get the list of components in the build
 * @returns the CSS string with `@import "stencil-hydrate"` replaced by generated styles
 */
export const resolveStencilHydrateImport = (
  css: string,
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
): string => css.replace(STENCIL_HYDRATE_RE, generateHydrateCss(config, buildCtx));

/**
 * Collect and build all component-level globalStyle/globalStyleUrl CSS from the current build.
 * Results are cached per file path via the existing globalStyleCache.
 *
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @returns concatenated CSS from all component globalStyle declarations
 */
export const collectAndBuildComponentGlobalStyles = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<string> => {
  const parts: string[] = [];

  for (const cmp of buildCtx.components) {
    if (!cmp.globalStyles?.length) continue;

    for (const gs of cmp.globalStyles) {
      if (gs.styleStr) {
        parts.push(gs.styleStr);
      } else if (gs.absolutePath) {
        const path = normalizePath(gs.absolutePath);
        compilerCtx.addWatchFile(path);

        const cached = compilerCtx.globalStyleCache.get(path);
        if (cached) {
          parts.push(cached);
          continue;
        }

        const result = await runPluginTransforms(config, compilerCtx, buildCtx, path);
        if (!result) continue;

        const cssCode = typeof result === 'string' ? result : result.code;
        if (!cssCode) continue;

        const optimized = await optimizeCss(
          config,
          compilerCtx,
          buildCtx.diagnostics,
          cssCode,
          path,
        );
        compilerCtx.globalStyleCache.set(path, optimized);
        parts.push(optimized);
      }
    }
  }

  return parts.join('\n');
};

/**
 * Replace `@import "stencil-globals"` in CSS with the collected component global styles.
 * Also registers component global style files as cssModuleImports of the global stylesheet
 * so the build cache is properly invalidated when those files change.
 *
 * @param css the CSS string to process
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @param globalStyleInputPath the absolute path of the global style input file (used as cache key)
 * @returns the CSS string with `@import "stencil-globals"` replaced by component global styles
 */
export const resolveStencilGlobalsImport = async (
  css: string,
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  globalStyleInputPath: string,
): Promise<string> => {
  const collectedCss = await collectAndBuildComponentGlobalStyles(config, compilerCtx, buildCtx);

  // Register component global style files as dependencies of this global stylesheet
  // so the cache is invalidated when they change.
  const filePaths = buildCtx.components
    .flatMap((cmp) => cmp.globalStyles ?? [])
    .filter((gs) => gs.absolutePath !== null)
    .map((gs) => normalizePath(gs.absolutePath!));

  if (filePaths.length > 0) {
    const existing = compilerCtx.cssModuleImports.get(globalStyleInputPath) ?? [];
    for (const p of filePaths) {
      if (!existing.includes(p)) existing.push(p);
    }
    compilerCtx.cssModuleImports.set(globalStyleInputPath, existing);
  }

  return css.replace(STENCIL_GLOBALS_RE, collectedCss);
};
