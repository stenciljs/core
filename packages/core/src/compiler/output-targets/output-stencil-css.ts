import type * as d from '@stencil/core';

import {
  buildError,
  isOutputTargetAssets,
  isOutputTargetGlobalStyle,
  isOutputTargetLoaderBundle,
  isOutputTargetStandalone,
  isOutputTargetWww,
  join,
  normalizePath,
} from '../../utils';
import {
  collectAndBuildComponentGlobalStyles,
  collectCssOnlyComponentStyles,
  generateHydrateCss,
  getHydrateAnchor,
} from '../style/component-global-styles';
import { buildGlobalStyleFromInput, upsertGlobalStyleLinkUpdate } from '../style/global-styles';
import { optimizeStyleCss } from '../style/optimize-style-css';

/** What each virtual import holds, for diagnostics. */
const STENCIL_VIRTUAL_IMPORT_CONTENTS: Record<d.StencilVirtualImport, string> = {
  'stencil-hydrate': 'pre-hydration (FOUC) styles for standalone components',
  'stencil-component-globals': 'component `globalStyle` / `globalStyleUrl` styles',
  'stencil-css-components': 'CSS-only component styles',
};

interface StencilCssPart {
  name: d.StencilVirtualImport;
  css: string;
}

/**
 * @param fsNamespace the config's `fsNamespace`
 * @returns the file name of the generated stylesheet, used when there's no `global-style` output
 */
export const getStencilCssFileName = (fsNamespace: string): string => `${fsNamespace}.css`;

const getGlobalStyleTargets = (config: d.ValidatedConfig) =>
  config.outputTargets.filter(isOutputTargetGlobalStyle).filter((t) => !!t.input);

/**
 * Find which `stencil-*` virtual imports are explicitly placed by a `global-style` input. Reads
 * what each input's build found post-preprocessing (so imports inside partials count), building
 * the inputs first if needed - cached, so this is cheap after the first call in a build.
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @returns the set of virtual imports referenced by at least one global-style input
 */
export const getExplicitStencilImports = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<Set<d.StencilVirtualImport>> => {
  const inputs = getGlobalStyleTargets(config).map((t) => normalizePath(t.input!));
  await Promise.all(
    inputs.map((input) => buildGlobalStyleFromInput(config, compilerCtx, buildCtx, input)),
  );
  return new Set(
    inputs.flatMap((input) => [...(compilerCtx.globalStyleVirtualImports.get(input) ?? [])]),
  );
};

/**
 * Collect the CSS for every `stencil-*` virtual import that no `global-style` input places
 * explicitly, in cascade order. Hydrate CSS goes wherever its anchor (see `getHydrateAnchor`)
 * does, so it's included here when the anchor is auto-placed; with no anchor, only for
 * `standalone` builds - otherwise the loader injects it at runtime.
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @returns the non-empty parts that need placing
 */
export const collectStencilCss = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<StencilCssPart[]> => {
  const explicit = await getExplicitStencilImports(config, compilerCtx, buildCtx);
  const parts: StencilCssPart[] = [];

  // hydrate CSS follows its anchor (see getHydrateAnchor) - placed here only if the anchor is;
  // with no anchor, only standalone builds need it, having no loader to inject it at runtime
  const anchor = getHydrateAnchor(buildCtx);
  const hydrateDue = anchor
    ? !explicit.has(anchor)
    : config.outputTargets.some(isOutputTargetStandalone);
  if (!explicit.has('stencil-hydrate') && config.invisiblePrehydration !== false && hydrateDue) {
    parts.push({ name: 'stencil-hydrate', css: generateHydrateCss(config, buildCtx) });
  }
  if (!explicit.has('stencil-component-globals')) {
    parts.push({
      name: 'stencil-component-globals',
      css: await collectAndBuildComponentGlobalStyles(config, compilerCtx, buildCtx),
    });
  }
  if (!explicit.has('stencil-css-components')) {
    parts.push({
      name: 'stencil-css-components',
      css: await collectCssOnlyComponentStyles(config, compilerCtx, buildCtx),
    });
  }

  return parts.filter((p) => !!p.css);
};

/**
 * Join and optimize the parts as one stylesheet - the same treatment they'd get if imported
 * explicitly, where the whole input is optimized after substitution.
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @param parts the parts to join, from {@link collectStencilCss}
 * @param filePath the stylesheet they're written to, for diagnostics
 * @returns the optimized CSS
 */
const joinParts = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  parts: StencilCssPart[],
  filePath: string,
) =>
  optimizeStyleCss(
    config,
    compilerCtx,
    buildCtx.diagnostics,
    parts.map((p) => p.css).join('\n'),
    filePath,
  );

/**
 * With exactly one `global-style` output, that's where un-imported stencil CSS goes. With none,
 * it gets its own `{fsNamespace}.css`; with several, placement is ambiguous and must be explicit.
 * @param config the Stencil configuration
 * @returns the single global-style output target, if there is exactly one
 */
export const getStencilCssMergeTarget = (
  config: d.ValidatedConfig,
): d.OutputTargetGlobalStyle | undefined => {
  const targets = getGlobalStyleTargets(config);
  return targets.length === 1 ? targets[0] : undefined;
};

/**
 * Prepend un-imported stencil CSS to the single global-style output's own CSS, so user globals
 * win the cascade.
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @param target the merge target, from {@link getStencilCssMergeTarget}
 * @param targetCss the target's own built CSS
 * @returns the combined CSS
 */
export const mergeStencilCss = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  target: d.OutputTargetGlobalStyle,
  targetCss: string,
): Promise<string> => {
  const parts = await collectStencilCss(config, compilerCtx, buildCtx);
  const stencilCss = await joinParts(config, compilerCtx, buildCtx, parts, target.input!);
  const changed = trackStencilCss(compilerCtx, stencilCss);
  const combined = [stencilCss, targetCss].filter(Boolean).join('\n');

  // the global style build may already have queued an HMR patch with only the target's CSS
  const queued = buildCtx.globalStylesUpdated.some((u) => u.fileName === target.fileName);
  if (isHmrRebuild(config, buildCtx) && (changed || queued)) {
    upsertGlobalStyleLinkUpdate(buildCtx, target.fileName, combined);
  }

  return combined;
};

/**
 * Place un-imported stencil CSS when there isn't exactly one `global-style` output to merge it
 * into (see {@link mergeStencilCss}):
 * - none: write `{fsNamespace}.css` to the assets dir (and `www` build dirs, which serve the
 *   app). A www-only project gets just the www copy, so it doesn't sprout an unused `dist/`.
 * - several: error, naming each import that needs placing.
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 */
export const outputStencilCss = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  const globalStyleTargets = getGlobalStyleTargets(config);
  if (globalStyleTargets.length === 1) return;

  const parts = await collectStencilCss(config, compilerCtx, buildCtx);

  if (globalStyleTargets.length > 1) {
    trackStencilCss(compilerCtx, '');
    // hydrate CSS follows its anchor, so placing the anchor places it too
    const anchor = getHydrateAnchor(buildCtx);
    for (const { name } of parts.filter((p) => !(anchor && p.name === 'stencil-hydrate'))) {
      const err = buildError(buildCtx.diagnostics);
      err.header = 'Global style placement';
      err.messageText =
        `Multiple "global-style" output targets are configured, but none contains ` +
        `@import "${name}". Add it to the global stylesheet that should hold ` +
        `${STENCIL_VIRTUAL_IMPORT_CONTENTS[name]}.`;
    }
    return;
  }

  const assetsTarget = config.outputTargets.find(isOutputTargetAssets);
  if (!assetsTarget?.dir) return;

  const fileName = getStencilCssFileName(config.fsNamespace);
  const primaryPath = join(assetsTarget.dir, fileName);
  const css = await joinParts(config, compilerCtx, buildCtx, parts, primaryPath);
  const changed = trackStencilCss(compilerCtx, css);
  if (!css) return;

  const wwwTargets = config.outputTargets.filter(isOutputTargetWww);
  const writePrimary =
    wwwTargets.length === 0 ||
    config.outputTargets.some((t) => isOutputTargetLoaderBundle(t) || isOutputTargetStandalone(t));

  await Promise.all([
    ...(writePrimary
      ? [compilerCtx.fs.writeFile(primaryPath, css, { outputTargetType: assetsTarget.type })]
      : []),
    ...wwwTargets.map((t) => compilerCtx.fs.writeFile(join(t.buildDir, fileName), css)),
  ]);

  if (writePrimary) buildCtx.stencilCssFile = primaryPath;

  if (isHmrRebuild(config, buildCtx) && changed) {
    upsertGlobalStyleLinkUpdate(buildCtx, fileName, css);
  }
};

/**
 * Record this build's generated CSS.
 * @param compilerCtx the compiler context, which holds the previous build's CSS
 * @param css this build's generated CSS
 * @returns true if it differs from the previous build's (always false on the first build)
 */
const trackStencilCss = (compilerCtx: d.CompilerCtx, css: string) => {
  const previous = compilerCtx.stencilCss;
  compilerCtx.stencilCss = css;
  return previous !== undefined && previous !== css;
};

const isHmrRebuild = (config: d.ValidatedConfig, buildCtx: d.BuildCtx) =>
  buildCtx.isRebuild && config.devServer?.reloadStrategy === 'hmr';
