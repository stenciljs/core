import { execSync } from 'child_process';
import type * as d from '@stencil/core';

import {
  isOutputTargetLoaderBundle,
  isOutputTargetStandalone,
  isOutputTargetTypes,
  isOutputTargetDistLazyLoader,
  join,
  normalizePath,
  relative,
} from '../../utils';

/**
 * Create export map entry point definitions for the `package.json` file using the npm CLI.
 *
 * In v5, this uses a "smart default" approach:
 * - Check if exports["."] already points to a valid output (loader-bundle or standalone)
 * - If valid, leave it alone (respect user customization)
 * - If missing or invalid, set a sensible default (loader-bundle > standalone priority)
 * - Always ensure types field is set correctly
 * - Generate per-component exports for standalone output
 *
 * @param config The validated Stencil config
 * @param buildCtx The build context containing the components to generate export maps for
 */
export const writeExportMaps = (config: d.ValidatedConfig, buildCtx: d.BuildCtx): void => {
  const loaderBundle = config.outputTargets.find(isOutputTargetLoaderBundle);
  const standalone = config.outputTargets.find(isOutputTargetStandalone);
  const types = config.outputTargets.find(isOutputTargetTypes);
  const lazyLoader = config.outputTargets.find(isOutputTargetDistLazyLoader);

  // Generate root export - use smart default approach
  generateRootExport(config, buildCtx, loaderBundle, standalone, types);

  // Generate loader export if lazy loader exists
  if (lazyLoader) {
    generateLoaderExport(config, lazyLoader);
  }

  // Generate per-component exports for standalone
  if (standalone) {
    generateComponentExports(config, buildCtx, standalone);
  }
};

/**
 * Generate the root export `exports["."]`.
 *
 * Uses smart default approach:
 * - Check if current root export points to a valid loader-bundle or standalone output
 * - If valid, leave it alone
 * - If missing or invalid, set default (loader-bundle > standalone priority)
 */
const generateRootExport = (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  loaderBundle: d.OutputTargetLoaderBundle | undefined,
  standalone: d.OutputTargetStandalone | undefined,
  types: d.OutputTargetTypes | undefined,
): void => {
  // No distributable outputs - nothing to do
  if (!loaderBundle && !standalone) {
    return;
  }

  // Check if the current root export already points to a valid output
  const currentExports = buildCtx.packageJson.exports as Record<string, unknown> | undefined;
  const currentRootExport = currentExports?.['.'] as Record<string, string> | undefined;
  const currentImport = currentRootExport?.import;

  // Determine if current import path is valid (points to loader-bundle or standalone)
  const isValidRoot = currentImport && isValidRootExport(config, currentImport, loaderBundle, standalone);

  // Only set root export if missing or invalid
  if (!isValidRoot) {
    // Priority: loader-bundle > standalone
    const primaryDir = loaderBundle?.dir ?? standalone?.dir;
    if (primaryDir) {
      const importPath = normalizePath(relative(config.rootDir, join(primaryDir, 'index.js')));
      execSync(`npm pkg set "exports[.][import]"="${importPath}"`);

      // Set CJS require path if loader-bundle has CJS enabled
      if (loaderBundle?.cjs) {
        const requirePath = normalizePath(relative(config.rootDir, join(loaderBundle.dir, 'index.cjs.js')));
        execSync(`npm pkg set "exports[.][require]"="${requirePath}"`);
      }
    }
  }

  // Always ensure types is set correctly (from the types output target)
  if (types?.dir) {
    const typesPath = normalizePath(relative(config.rootDir, join(types.dir, 'index.d.ts')));
    execSync(`npm pkg set "exports[.][types]"="${typesPath}"`);
  }
};

/**
 * Check if the current root export import path is valid
 * (points to either loader-bundle or standalone output).
 */
const isValidRootExport = (
  config: d.ValidatedConfig,
  currentImport: string,
  loaderBundle: d.OutputTargetLoaderBundle | undefined,
  standalone: d.OutputTargetStandalone | undefined,
): boolean => {
  const normalizedCurrent = normalizePath(currentImport);

  // Check if it points to loader-bundle
  if (loaderBundle?.dir) {
    const loaderBundlePath = normalizePath(relative(config.rootDir, loaderBundle.dir));
    if (normalizedCurrent.includes(loaderBundlePath)) {
      return true;
    }
  }

  // Check if it points to standalone
  if (standalone?.dir) {
    const standalonePath = normalizePath(relative(config.rootDir, standalone.dir));
    if (normalizedCurrent.includes(standalonePath)) {
      return true;
    }
  }

  return false;
};

/**
 * Generate the loader export `exports["./loader"]`.
 */
const generateLoaderExport = (
  config: d.ValidatedConfig,
  lazyLoader: d.OutputTargetDistLazyLoader,
): void => {
  let outDir = relative(config.rootDir, lazyLoader.dir);
  if (!outDir.startsWith('.')) {
    outDir = './' + outDir;
  }

  execSync(`npm pkg set "exports[./loader][import]"="${outDir}/index.js"`);
  execSync(`npm pkg set "exports[./loader][require]"="${outDir}/index.cjs"`);
  execSync(`npm pkg set "exports[./loader][types]"="${outDir}/index.d.ts"`);
};

/**
 * Generate per-component exports for standalone output.
 * Each component gets its own subpath export: `exports["./my-component"]`
 */
const generateComponentExports = (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  standalone: d.OutputTargetStandalone,
): void => {
  let outDir = relative(config.rootDir, standalone.dir!);
  if (!outDir.startsWith('.')) {
    outDir = './' + outDir;
  }

  buildCtx.components.forEach((cmp) => {
    execSync(`npm pkg set "exports[./${cmp.tagName}][import]"="${outDir}/${cmp.tagName}.js"`);
    execSync(`npm pkg set "exports[./${cmp.tagName}][types]"="${outDir}/${cmp.tagName}.d.ts"`);
  });
};
