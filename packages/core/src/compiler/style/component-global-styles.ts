import type * as d from '@stencil/core';

import { normalizePath } from '../../utils';
import { runPluginTransforms } from '../plugin/plugin';
import { optimizeStyleCss } from './optimize-style-css';
import { wrapCssWithImportModifiers } from './style-utils';

// the trailing capture group picks up any modifiers (e.g. `layer(name)`) following the specifier
const STENCIL_GLOBALS_RE = /@import\s+(?:url\()?\s*['"]stencil-globals['"]\s*\)?([^;]*);?/g;
const STENCIL_HYDRATE_RE = /@import\s+(?:url\()?\s*['"]stencil-hydrate['"]\s*\)?([^;]*);?/g;

export const hasStencilGlobalsImport = (css: string): boolean => css.includes('stencil-globals');
export const hasStencilHydrateImport = (css: string): boolean => css.includes('stencil-hydrate');

/**
 * Generate the FOUC-prevention CSS for a set of component tags. Mirrors the CSS injected
 * dynamically by bootstrap-loader, but produced at build time so it can be embedded in a static
 * stylesheet via `@import "stencil-hydrate"`.
 *
 * @param hydratedFlag the config's `hydratedFlag` setting (`null` means explicitly disabled)
 * @param tagNames every component tag name in the build
 * @returns the generated CSS string to replace `@import "stencil-hydrate"` with
 */
export const buildHydrateCss = (
  hydratedFlag: d.HydratedFlag | null | undefined,
  tagNames: string[],
): string => {
  if (!hydratedFlag) return ''; // hydratedFlag: null means explicitly disabled
  if (!tagNames.length) return '';

  const tags = [...tagNames].sort();
  const selector =
    hydratedFlag.selector === 'attribute' ? `[${hydratedFlag.name}]` : `.${hydratedFlag.name}`;
  const initial =
    hydratedFlag.initialValue === '' || hydratedFlag.initialValue == null
      ? ''
      : `{${hydratedFlag.property}:${hydratedFlag.initialValue}}`;
  const hydrated =
    hydratedFlag.hydratedValue === '' || hydratedFlag.hydratedValue == null
      ? ''
      : `${selector}{${hydratedFlag.property}:${hydratedFlag.hydratedValue}}`;

  return tags.join(',') + initial + hydrated;
};

/**
 * Generate the FOUC-prevention CSS for all (non css-only) components in the build.
 * @param config the Stencil configuration
 * @param buildCtx the current build context, used to get the list of components in the build
 * @returns the generated CSS string to replace `@import "stencil-hydrate"` with
 */
export const generateHydrateCss = (config: d.ValidatedConfig, buildCtx: d.BuildCtx): string =>
  buildHydrateCss(
    config.hydratedFlag,
    buildCtx.components.map((c) => c.tagName),
  );

/**
 * Replace `@import "stencil-hydrate"` in CSS with the given FOUC-prevention styles. Supports
 * trailing `layer()`/`supports()`/media modifiers, e.g. `@import "stencil-hydrate" layer(init);`.
 *
 * Pure function - see {@link buildHydrateCss}.
 *
 * @param css the CSS string to process
 * @param hydrateCss the generated hydrate CSS to substitute in, from {@link buildHydrateCss}
 * @returns the CSS string with `@import "stencil-hydrate"` replaced by hydrateCss
 */
export const replaceStencilHydrateImport = (css: string, hydrateCss: string): string =>
  css.replace(STENCIL_HYDRATE_RE, (_match, modifiers: string) =>
    wrapCssWithImportModifiers(hydrateCss, modifiers),
  );

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

        const optimized = await optimizeStyleCss(
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
 * Replace `@import "stencil-globals"` in CSS with the given collected component global styles.
 * Supports trailing `layer()`/`supports()`/media modifiers, e.g. `@import "stencil-globals" layer(init);`.
 *
 * @param css the CSS string to process
 * @param collectedCss the collected component global styles, from {@link collectAndBuildComponentGlobalStyles}
 * @returns the CSS string with `@import "stencil-globals"` replaced by collectedCss
 */
export const replaceStencilGlobalsImport = (css: string, collectedCss: string): string =>
  css.replace(STENCIL_GLOBALS_RE, (_match, modifiers: string) =>
    wrapCssWithImportModifiers(collectedCss, modifiers),
  );

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

  return replaceStencilGlobalsImport(css, collectedCss);
};

const STENCIL_CSS_COMPONENTS_RE =
  /@import\s+(?:url\()?\s*['"]stencil-css-components['"]\s*\)?([^;]*);?/g;
export const hasStencilCssComponentsImport = (css: string): boolean =>
  css.includes('stencil-css-components');

/**
 * Collect and build the CSS for every discovered CSS-only component's source file, deduped by
 * file (a file may define more than one CSS-only component, but is emitted as a single chunk -
 * see `buildCtx.cssOnlyComponents`'s doc comment). Results are cached per file path via the
 * existing globalStyleCache.
 *
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @returns concatenated CSS from every CSS-only component's source file
 */
export const collectCssOnlyComponentStyles = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<string> => {
  const parts: string[] = [];
  const seenFiles = new Set<string>();

  for (const cmp of buildCtx.cssOnlyComponents) {
    const path = normalizePath(cmp.sourceFilePath);
    if (seenFiles.has(path)) continue;
    seenFiles.add(path);

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

    const optimized = await optimizeStyleCss(
      config,
      compilerCtx,
      buildCtx.diagnostics,
      cssCode,
      path,
    );
    compilerCtx.globalStyleCache.set(path, optimized);
    parts.push(optimized);
  }

  return parts.join('\n');
};

/**
 * Replace `@import "stencil-css-components"` in CSS with the given collected CSS-only component
 * styles. Supports trailing `layer()`/`supports()`/media modifiers, same as `@import "stencil-globals"`.
 *
 * @param css the CSS string to process
 * @param collectedCss the collected CSS-only component styles, from {@link collectCssOnlyComponentStyles}
 * @returns the CSS string with `@import "stencil-css-components"` replaced by collectedCss
 */
export const replaceStencilCssComponentsImport = (css: string, collectedCss: string): string =>
  css.replace(STENCIL_CSS_COMPONENTS_RE, (_match, modifiers: string) =>
    wrapCssWithImportModifiers(collectedCss, modifiers),
  );

/**
 * Replace `@import "stencil-css-components"` in CSS with the collected CSS-only component
 * styles. Also registers CSS-only component source files as cssModuleImports of the global
 * stylesheet so the build cache is properly invalidated when those files change.
 *
 * @param css the CSS string to process
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @param globalStyleInputPath the absolute path of the global style input file (used as cache key)
 * @returns the CSS string with `@import "stencil-css-components"` replaced by CSS-only component styles
 */
export const resolveStencilCssComponentsImport = async (
  css: string,
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  globalStyleInputPath: string,
): Promise<string> => {
  const collectedCss = await collectCssOnlyComponentStyles(config, compilerCtx, buildCtx);

  const filePaths = Array.from(
    new Set(buildCtx.cssOnlyComponents.map((cmp) => normalizePath(cmp.sourceFilePath))),
  );

  if (filePaths.length > 0) {
    const existing = compilerCtx.cssModuleImports.get(globalStyleInputPath) ?? [];
    for (const p of filePaths) {
      if (!existing.includes(p)) existing.push(p);
    }
    compilerCtx.cssModuleImports.set(globalStyleInputPath, existing);
  }

  return replaceStencilCssComponentsImport(css, collectedCss);
};
