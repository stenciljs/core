import type * as d from '@stencil/core';

import { catchError, isOutputTargetGlobalStyle, normalizePath } from '../../utils';
import { runPluginTransforms } from '../plugin/plugin';
import {
  findStencilVirtualImports,
  generateHydrateCss,
  getAnchoredHydrateCss,
  getHydrateAnchor,
  hasStencilCssComponentsImport,
  hasStencilGlobalsImport,
  hasStencilHydrateImport,
  insertBeforeStencilImport,
  replaceStencilHydrateImport,
  resolveStencilCssComponentsImport,
  resolveStencilGlobalsImport,
} from './component-global-styles';
import { getCssImports } from './css-imports';
import { optimizeStyleCss } from './optimize-style-css';

/**
 * Drop cached CSS for files this rebuild changed or deleted. The cache is keyed by file path and
 * shared by global-style inputs and the files feeding their virtual imports (a component's
 * `globalStyleUrl`, a CSS-only component) - the latter are otherwise never rebuilt once cached.
 *
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 */
export const evictChangedGlobalStyles = (compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  for (const filePath of [...buildCtx.filesChanged, ...buildCtx.filesDeleted]) {
    compilerCtx.globalStyleCache.delete(normalizePath(filePath));
  }
};

/**
 * Build global styles from the `globalStyle` config option (legacy entry point).
 *
 * This is called during the build phase to pre-build the globalStyle CSS for HMR.
 * The actual file writes are handled by the `outputGlobalStyle` output target generator,
 * which may also build additional CSS from explicit `input` on output targets.
 *
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @returns the built CSS string, or empty string if no globalStyle configured
 */
export const generateGlobalStyles = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<string> => {
  if (!config.globalStyle) {
    return '';
  }

  const globalStyles = await buildGlobalStyleFromInput(
    config,
    compilerCtx,
    buildCtx,
    config.globalStyle,
  );
  return globalStyles ?? '';
};

/**
 * Whether any global-style input imports `stencil-hydrate` itself. Reads each input's recorded
 * imports, running just the preprocessing pass for one not built yet - building the others in full
 * from inside one input's build would recurse.
 *
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @returns whether some input places `stencil-hydrate`
 */
const isHydratePlacedExplicitly = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<boolean> => {
  const inputs = config.outputTargets
    .filter(isOutputTargetGlobalStyle)
    .map((t) => t.input)
    .filter((input): input is string => !!input)
    .map((input) => normalizePath(input));

  for (const input of inputs) {
    let found = compilerCtx.globalStyleVirtualImports.get(input);
    if (!found) {
      const result = await runPluginTransforms(config, compilerCtx, buildCtx, input);
      const code = typeof result === 'string' ? result : result?.code;
      if (!code) continue;
      found = findStencilVirtualImports(code);
      compilerCtx.globalStyleVirtualImports.set(input, found);
    }
    if (found.has('stencil-hydrate')) return true;
  }
  return false;
};

/**
 * Build global styles from a specific input file path.
 *
 * Uses a per-path cache to support multiple global style inputs.
 * Called by output target generators for each global-style output.
 *
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @param inputPath the input CSS file path to build
 * @returns the built CSS string, or null if build failed
 */
export const buildGlobalStyleFromInput = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  inputPath: string,
): Promise<string | null> => {
  if (!inputPath) {
    return null;
  }

  const normalizedPath = normalizePath(inputPath);

  const canSkip = await canSkipGlobalStyleBuild(config, compilerCtx, buildCtx, normalizedPath);
  if (canSkip) {
    return compilerCtx.globalStyleCache.get(normalizedPath) ?? null;
  }

  try {
    compilerCtx.addWatchFile(normalizedPath);

    const transformResults = await runPluginTransforms(
      config,
      compilerCtx,
      buildCtx,
      normalizedPath,
    );

    if (transformResults) {
      let cssCode: string;
      let dependencies: string[] | undefined;

      if (typeof transformResults === 'string') {
        cssCode = transformResults;
        dependencies = undefined;
      } else if (typeof transformResults === 'object' && transformResults.code) {
        cssCode = transformResults.code;
        dependencies = transformResults.dependencies;
      } else {
        compilerCtx.globalStyleCache.delete(normalizedPath);
        compilerCtx.globalStyleVirtualImports.delete(normalizedPath);
        return null;
      }

      const virtualImports = findStencilVirtualImports(cssCode);
      compilerCtx.globalStyleVirtualImports.set(normalizedPath, virtualImports);

      // no input places `stencil-hydrate` - it goes just before the anchor's own import
      const hydrateAnchor = getHydrateAnchor(buildCtx);
      if (
        hydrateAnchor &&
        virtualImports.has(hydrateAnchor) &&
        !(await isHydratePlacedExplicitly(config, compilerCtx, buildCtx))
      ) {
        const hydrateCss = getAnchoredHydrateCss(config, buildCtx);
        if (hydrateCss) cssCode = insertBeforeStencilImport(cssCode, hydrateAnchor, hydrateCss);
      }

      if (hasStencilGlobalsImport(cssCode)) {
        cssCode = await resolveStencilGlobalsImport(
          cssCode,
          config,
          compilerCtx,
          buildCtx,
          normalizedPath,
        );
      }

      if (hasStencilHydrateImport(cssCode)) {
        cssCode = replaceStencilHydrateImport(cssCode, generateHydrateCss(config, buildCtx));
      }

      if (hasStencilCssComponentsImport(cssCode)) {
        cssCode = await resolveStencilCssComponentsImport(
          cssCode,
          config,
          compilerCtx,
          buildCtx,
          normalizedPath,
        );
      }

      const optimizedCss = await optimizeStyleCss(
        config,
        compilerCtx,
        buildCtx.diagnostics,
        cssCode,
        normalizedPath,
      );
      compilerCtx.globalStyleCache.set(normalizedPath, optimizedCss);

      if (Array.isArray(dependencies)) {
        const cssModuleImports = compilerCtx.cssModuleImports.get(normalizedPath) || [];
        dependencies.forEach((dep: string) => {
          compilerCtx.addWatchFile(dep);
          if (!cssModuleImports.includes(dep)) {
            cssModuleImports.push(dep);
          }
        });
        compilerCtx.cssModuleImports.set(normalizedPath, cssModuleImports);
      }

      // Track global style changes for live-reload: every `global-style` output target
      // whose `input` matches this path gets a fileName-keyed patch, so the dev-server
      // client can update the `<style>` it keeps next to that target's own `<link>`
      // (see `hmrGlobalStyleLinks` in packages/dev-server) rather than only the legacy
      // `config.globalStyle` entry point.
      if (buildCtx.isRebuild && config.devServer?.reloadStrategy === 'hmr') {
        config.outputTargets
          .filter(isOutputTargetGlobalStyle)
          .filter((target) => target.input && normalizePath(target.input) === normalizedPath)
          .forEach((target) => {
            upsertGlobalStyleLinkUpdate(buildCtx, target.fileName!, optimizedCss);
          });
      }

      return optimizedCss;
    }
  } catch (e: any) {
    const d = catchError(buildCtx.diagnostics, e);
    d.absFilePath = normalizedPath;
  }

  compilerCtx.globalStyleCache.delete(normalizedPath);
  compilerCtx.globalStyleVirtualImports.delete(normalizedPath);
  return null;
};

/**
 * Add or update a fileName-keyed global style HMR entry. `buildGlobalStyleFromInput` can
 * be called more than once per rebuild for the same input (e.g. once from the output
 * target, once from bundling) before its cache is populated, so this de-dupes by
 * `fileName` rather than letting the client apply the same patch several times.
 *
 * @param buildCtx the build context
 * @param fileName the `global-style` output target's fileName
 * @param styleText the newly built CSS for that target
 */
export const upsertGlobalStyleLinkUpdate = (
  buildCtx: d.BuildCtx,
  fileName: string,
  styleText: string,
): void => {
  const existing = buildCtx.globalStylesUpdated.find((u) => u.fileName === fileName);
  if (existing) {
    existing.styleText = styleText;
  } else {
    buildCtx.globalStylesUpdated.push({ fileName, styleText });
  }
};

const canSkipGlobalStyleBuild = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  inputPath: string,
) => {
  const cached = compilerCtx.globalStyleCache.get(inputPath);
  if (!cached) {
    return false;
  }

  // First build (not a watch rebuild): if we have cache, it was set earlier in this same build.
  // Use it without further checks to avoid duplicate builds.
  if (!buildCtx.isRebuild) {
    return true;
  }

  // Watch rebuild: check if cache is still valid
  if (buildCtx.requiresFullBuild) {
    return false;
  }

  if (!buildCtx.hasStyleChanges) {
    return true;
  }

  if (buildCtx.filesChanged.includes(inputPath)) {
    return false;
  }

  const cssModuleImports = compilerCtx.cssModuleImports.get(inputPath);
  if (cssModuleImports && buildCtx.filesChanged.some((f) => cssModuleImports.includes(f))) {
    return false;
  }

  const hasChangedImports = await hasChangedImportFile(
    config,
    compilerCtx,
    buildCtx,
    inputPath,
    cached,
    [],
  );
  if (hasChangedImports) {
    return false;
  }

  return true;
};

const hasChangedImportFile = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  filePath: string,
  content: string,
  noLoop: string[],
): Promise<boolean> => {
  if (noLoop.includes(filePath)) {
    return false;
  }
  noLoop.push(filePath);

  return hasChangedImportContent(config, compilerCtx, buildCtx, filePath, content, noLoop);
};

const hasChangedImportContent = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  filePath: string,
  content: string,
  checkedFiles: string[],
) => {
  const cssImports = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
  if (cssImports.length === 0) {
    // don't bother
    return false;
  }

  const isChangedImport = buildCtx.filesChanged.some((changedFilePath) => {
    return cssImports.some((c) => c.filePath === changedFilePath);
  });

  if (isChangedImport) {
    // one of the changed files is an import of this file
    return true;
  }

  // keep digging
  const promises = cssImports.map(async (cssImportData) => {
    try {
      const importContent = await compilerCtx.fs.readFile(cssImportData.filePath);
      return hasChangedImportFile(
        config,
        compilerCtx,
        buildCtx,
        cssImportData.filePath,
        importContent,
        checkedFiles,
      );
    } catch {
      return false;
    }
  });

  const results = await Promise.all(promises);

  return results.includes(true);
};
