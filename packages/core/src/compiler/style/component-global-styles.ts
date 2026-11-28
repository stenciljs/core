import type * as d from '@stencil/core';

import { normalizePath } from '../../utils';
import { runPluginTransforms } from '../plugin/plugin';
import { optimizeStyleCss } from './optimize-style-css';
import { wrapCssWithImportModifiers } from './style-utils';

const STENCIL_VIRTUAL_IMPORTS: d.StencilVirtualImport[] = [
  'stencil-hydrate',
  'stencil-component-globals',
  'stencil-css-components',
];

/**
 * Match `@import` of a `stencil-*` virtual import in any form CSS allows or a preprocessor emits:
 * quoted or not, bare or `url()`-wrapped, and with or without whitespace after `@import` (Sass's
 * compressed output drops it). Capture group 2 holds any trailing modifiers, e.g. `layer(name)`.
 * @param name the virtual import to match
 * @returns a global regex
 */
const stencilVirtualImportRe = (name: d.StencilVirtualImport) =>
  new RegExp(
    `@import(?:\\s+|(?=['"]|url\\())(?:url\\(\\s*)?(['"]?)${name}(?![\\w-])\\1\\s*\\)?([^;]*);?`,
    'g',
  );

const STENCIL_GLOBALS_RE = stencilVirtualImportRe('stencil-component-globals');
const STENCIL_HYDRATE_RE = stencilVirtualImportRe('stencil-hydrate');
const STENCIL_CSS_COMPONENTS_RE = stencilVirtualImportRe('stencil-css-components');

/**
 * Find which `stencil-*` virtual imports appear as real `@import` statements in CSS.
 * @param css the CSS to scan - pass post-preprocessing CSS so imports from partials are seen
 * @returns the virtual imports found
 */
export const findStencilVirtualImports = (css: string): Set<d.StencilVirtualImport> =>
  new Set(STENCIL_VIRTUAL_IMPORTS.filter((name) => stencilVirtualImportRe(name).test(css)));

export const hasStencilGlobalsImport = (css: string): boolean =>
  css.includes('stencil-component-globals');
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
 * The virtual import whose stylesheet also takes the FOUC-prevention CSS when no global-style
 * input places `stencil-hydrate` itself: component global styles, or else CSS-only components.
 * Consumers already have to load whichever stylesheet holds either, so the loader's runtime
 * injection isn't needed.
 * @param buildCtx the current build context
 * @returns the anchor, or `undefined` if the build has neither
 */
export const getHydrateAnchor = (buildCtx: d.BuildCtx): d.StencilVirtualImport | undefined => {
  if (buildCtx.components.some((c) => c.globalStyles?.length)) return 'stencil-component-globals';
  if (buildCtx.cssOnlyComponents.length) return 'stencil-css-components';
  return undefined;
};

/**
 * The FOUC-prevention CSS to place alongside the {@link getHydrateAnchor anchor}.
 * @param config the Stencil configuration
 * @param buildCtx the current build context
 * @returns the CSS, or an empty string when there's no anchor or prehydration hiding is off
 */
export const getAnchoredHydrateCss = (config: d.ValidatedConfig, buildCtx: d.BuildCtx): string =>
  config.invisiblePrehydration === false || !getHydrateAnchor(buildCtx)
    ? ''
    : generateHydrateCss(config, buildCtx);

/**
 * Insert text immediately before the first `@import` of a virtual import - outside any modifiers
 * that import carries, which describe its own content.
 * @param css the CSS to insert into
 * @param name the virtual import to insert before
 * @param text the text to insert
 * @returns the CSS with `text` inserted, or unchanged if it has no such import
 */
export const insertBeforeStencilImport = (
  css: string,
  name: d.StencilVirtualImport,
  text: string,
): string =>
  css.replace(new RegExp(stencilVirtualImportRe(name).source), (match) => `${text}\n${match}`);

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
  css.replace(STENCIL_HYDRATE_RE, (_match, _quote, modifiers: string) =>
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
 * Replace `@import "stencil-component-globals"` in CSS with the given collected component global styles.
 * Supports trailing `layer()`/`supports()`/media modifiers, e.g. `@import "stencil-component-globals" layer(init);`.
 *
 * @param css the CSS string to process
 * @param collectedCss the collected component global styles, from {@link collectAndBuildComponentGlobalStyles}
 * @returns the CSS string with `@import "stencil-component-globals"` replaced by collectedCss
 */
export const replaceStencilGlobalsImport = (css: string, collectedCss: string): string =>
  css.replace(STENCIL_GLOBALS_RE, (_match, _quote, modifiers: string) =>
    wrapCssWithImportModifiers(collectedCss, modifiers),
  );

/**
 * Replace `@import "stencil-component-globals"` in CSS with the collected component global styles.
 * Also registers component global style files as cssModuleImports of the global stylesheet
 * so the build cache is properly invalidated when those files change.
 *
 * @param css the CSS string to process
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @param globalStyleInputPath the absolute path of the global style input file (used as cache key)
 * @returns the CSS string with `@import "stencil-component-globals"` replaced by component global styles
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
 * styles. Supports trailing `layer()`/`supports()`/media modifiers, same as `@import "stencil-component-globals"`.
 *
 * @param css the CSS string to process
 * @param collectedCss the collected CSS-only component styles, from {@link collectCssOnlyComponentStyles}
 * @returns the CSS string with `@import "stencil-css-components"` replaced by collectedCss
 */
export const replaceStencilCssComponentsImport = (css: string, collectedCss: string): string =>
  css.replace(STENCIL_CSS_COMPONENTS_RE, (_match, _quote, modifiers: string) =>
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
