import type * as d from '@stencil/core';

import { catchError, normalizePath } from '../../utils';
import { runPluginTransforms } from '../plugin/plugin';
import { hasStencilGlobalsImport, resolveStencilGlobalsImport } from './component-global-styles';
import { getCssImports } from './css-imports';
import { optimizeCss } from './optimize-css';

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
        return null;
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

      const optimizedCss = await optimizeCss(
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

      // Track global style changes for HMR (only for the primary globalStyle)
      if (
        buildCtx.isRebuild &&
        config.devServer?.reloadStrategy === 'hmr' &&
        normalizedPath === normalizePath(config.globalStyle ?? '')
      ) {
        buildCtx.stylesUpdated.push({
          styleTag: 'global',
          styleMode: undefined,
          styleText: optimizedCss,
        });
      }

      return optimizedCss;
    }
  } catch (e: any) {
    const d = catchError(buildCtx.diagnostics, e);
    d.absFilePath = normalizedPath;
  }

  compilerCtx.globalStyleCache.delete(normalizedPath);
  return null;
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
