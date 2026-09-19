/**
 * Resolves Stencil's three virtual global-stylesheet imports: `@import "stencil-globals"`,
 * `@import "stencil-hydrate"`, and `@import "stencil-css-components"`.
 *
 * Rewrites the consumer file's text directly in `transform`, using the substitution helpers
 * exported from `@stencil/core/compiler` to replace `@import "stencil-*"`.
 * Without buildCtx gather the project data where substitutions need it via a project-wide scan
 * (see `scanDocs` in `plugin.ts`).
 */
import {
  buildHydrateCss,
  hasStencilCssComponentsImport,
  hasStencilGlobalsImport,
  hasStencilHydrateImport,
  replaceStencilCssComponentsImport,
  replaceStencilGlobalsImport,
  replaceStencilHydrateImport,
} from '@stencil/core/compiler';
import type { ComponentGlobalStyle, HydratedFlag } from '@stencil/core/compiler';

import { processCssFile } from './css.js';

export const hasVirtualGlobalImport = (code: string): boolean =>
  hasStencilGlobalsImport(code) ||
  hasStencilHydrateImport(code) ||
  hasStencilCssComponentsImport(code);

/** Project-wide data the three substitutions need, gathered once by `scanDocs`. */
export interface GlobalCssProjectData {
  /** Every component's `@Component({ globalStyle / globalStyleUrl })` entries. */
  componentGlobalStyles: ComponentGlobalStyle[];
  /** `.css` files that define at least one CSS-only component (`@component`-marked). */
  cssOnlyComponentFiles: Set<string>;
  /** Every custom-element tag name discovered in the project. */
  tagNames: Set<string>;
  hydratedFlag: HydratedFlag | null;
}

// Processed-CSS cache per ingredient file path, shared across the whole plugin instance - a
// globalStyleUrl / CSS-only-component file is typically read once per build and reused by every
// `@import "stencil-globals"`/`"stencil-css-components"` occurrence that references it.
const processedFileCache = new Map<string, string>();

/**
 * Drop a cached ingredient's processed CSS - call when the file changes, e.g. from `handleHotUpdate`.
 * @param filePath absolute path of the ingredient file to evict from the cache
 */
export function invalidateGlobalCssFile(filePath: string): void {
  processedFileCache.delete(filePath);
}

async function collectFileParts(
  filePaths: Iterable<string>,
  isDev: boolean,
): Promise<{ css: string; deps: string[] }> {
  const parts: string[] = [];
  const deps: string[] = [];
  for (const filePath of filePaths) {
    deps.push(filePath);
    let css = processedFileCache.get(filePath);
    if (css === undefined) {
      const processed = await processCssFile(filePath, isDev);
      if (!processed) continue;
      css = processed.css;
      processedFileCache.set(filePath, css);
      deps.push(...processed.deps);
    }
    parts.push(css);
  }
  return { css: parts.join('\n'), deps };
}

async function collectComponentGlobalStyles(
  entries: ComponentGlobalStyle[],
  isDev: boolean,
): Promise<{ css: string; deps: string[] }> {
  const inline: string[] = [];
  const filePaths: string[] = [];
  for (const gs of entries) {
    if (gs.styleStr) inline.push(gs.styleStr);
    else if (gs.absolutePath) filePaths.push(gs.absolutePath);
  }
  const { css: fileCss, deps } = await collectFileParts(filePaths, isDev);
  return { css: [...inline, fileCss].filter(Boolean).join('\n'), deps };
}

/**
 * Replace every occurrence of the three virtual specifiers in `code` with their resolved CSS.
 * @param code the consumer file's CSS text (the file containing the `@import`s)
 * @param data project-wide data collected by `scanDocs`
 * @param isDev `true` in dev mode (disables minification in the ingredient preprocessing chain)
 * @returns the substituted code, plus every ingredient file path it drew content from (register
 * these as watch files / HMR dependencies of the consumer)
 */
export async function resolveVirtualGlobalImports(
  code: string,
  data: GlobalCssProjectData,
  isDev: boolean,
): Promise<{ code: string; deps: string[] }> {
  let result = code;
  const deps: string[] = [];

  if (hasStencilGlobalsImport(result)) {
    const { css, deps: d } = await collectComponentGlobalStyles(data.componentGlobalStyles, isDev);
    deps.push(...d);
    result = replaceStencilGlobalsImport(result, css);
  }

  if (hasStencilHydrateImport(result)) {
    result = replaceStencilHydrateImport(
      result,
      buildHydrateCss(data.hydratedFlag, [...data.tagNames]),
    );
  }

  if (hasStencilCssComponentsImport(result)) {
    const { css, deps: d } = await collectFileParts(data.cssOnlyComponentFiles, isDev);
    deps.push(...d);
    result = replaceStencilCssComponentsImport(result, css);
  }

  return { code: result, deps };
}
