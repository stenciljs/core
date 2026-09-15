import { execSync } from 'child_process';
import type * as d from '@stencil/core';

import {
  buildWarn,
  isOutputTargetLoaderBundle,
  isOutputTargetStandalone,
  isOutputTargetTypes,
  join,
  normalizePath,
  relative,
} from '../../utils';

/**
 * A function that runs `npm pkg set <cmd>`, tolerating an unusable `npm` CLI.
 * Once a call fails, all subsequent calls become no-ops for the rest of the build
 * (the CLI being unavailable isn't something that recovers mid-build).
 */
type NpmPkgSet = (cmd: string) => void;

/**
 * Create the shared {@link NpmPkgSet} used across a single `writeExportMaps` run.
 * @param buildCtx The build context to report a warning diagnostic on if `npm` can't be run
 * @returns A function that shells out to `npm pkg set`, swallowing failure after warning once
 */
const createNpmPkgSet = (buildCtx: d.BuildCtx): NpmPkgSet => {
  let npmAvailable = true;
  return (cmd: string): void => {
    if (!npmAvailable) {
      return;
    }
    try {
      execSync(`npm pkg set ${cmd}`);
    } catch (e: any) {
      npmAvailable = false;
      const warn = buildWarn(buildCtx.diagnostics);
      warn.messageText = `Unable to generate "exports" map in package.json: the "npm" CLI could not be run (${e.message ?? e}). Set "generateExportMaps: false" in your Stencil config to silence this warning.`;
    }
  };
};

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
 * @param compilerCtx The compiler context (used to detect a user-authored src/index.ts)
 * @param buildCtx The build context containing the components to generate export maps for
 */
export const writeExportMaps = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): void => {
  const loaderBundle = config.outputTargets.find(isOutputTargetLoaderBundle);
  const standalone = config.outputTargets.find(isOutputTargetStandalone);
  const types = config.outputTargets.find(isOutputTargetTypes);
  const npmPkgSet = createNpmPkgSet(buildCtx);

  // Generate root export - use smart default approach
  generateRootExport(config, compilerCtx, buildCtx, loaderBundle, standalone, types, npmPkgSet);

  // Generate loader export if loader-bundle exists
  // Points directly to esm/loader.js (no separate loader directory)
  if (loaderBundle) {
    generateLoaderExport(config, loaderBundle, types, npmPkgSet);
  }

  // Generate per-component exports for standalone
  if (standalone) {
    generateComponentExports(config, buildCtx, standalone, npmPkgSet);
  }
};

/**
 * Generate the root export `exports["."]`.
 *
 * Uses smart default approach:
 * - Check if current root export points to a valid loader-bundle or standalone output
 * - If valid, leave it alone
 * - If missing or invalid, set default (loader-bundle > standalone priority)
 * @param config The validated Stencil config
 * @param compilerCtx The compiler context (used to detect a user-authored src/index.ts)
 * @param buildCtx The build context containing the components to generate export maps for
 * @param loaderBundle The loader-bundle output target, if it exists
 * @param standalone The standalone output target, if it exists
 * @param types The types output target, if it exists
 * @param npmPkgSet Function used to run `npm pkg set`, tolerating an unavailable npm CLI
 */
const generateRootExport = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  loaderBundle: d.OutputTargetLoaderBundle | undefined,
  standalone: d.OutputTargetStandalone | undefined,
  types: d.OutputTargetTypes | undefined,
  npmPkgSet: NpmPkgSet,
): void => {
  // No distributable outputs - nothing to do
  if (!loaderBundle && !standalone) {
    return;
  }

  // Without a src/index.ts, the loader-bundle's own index.js/index.d.ts are just an
  // empty auto-generated stub - the real entry point is the esm/loader.js it forwards to.
  const hasSrcIndex = compilerCtx.fs.accessSync(join(config.srcDir, 'index.ts'));
  const rootUsesEmptyLoaderIndex = !!loaderBundle && !hasSrcIndex;

  // Check if the current root export already points to a valid output
  const currentExports = buildCtx.packageJson?.exports as Record<string, unknown> | undefined;
  const currentRootExport = currentExports?.['.'] as Record<string, string> | undefined;
  const currentImport = currentRootExport?.import;

  // Determine if current import path is valid (points to loader-bundle or standalone)
  const isValidRoot =
    currentImport && isValidRootExport(config, currentImport, loaderBundle, standalone);

  // Only set root export if missing or invalid
  if (!isValidRoot) {
    // Priority: loader-bundle > standalone
    const primaryDir = loaderBundle?.dir ?? standalone?.dir;
    if (primaryDir) {
      const entryFile = rootUsesEmptyLoaderIndex ? join('esm', 'loader.js') : 'index.js';
      const importPath = normalizePath(relative(config.rootDir, join(primaryDir, entryFile)));
      npmPkgSet(`"exports[.][import]"="${importPath}"`);

      // Set CJS require path if loader-bundle has CJS enabled
      if (loaderBundle?.cjs) {
        const cjsEntryFile = rootUsesEmptyLoaderIndex ? join('cjs', 'loader.cjs') : 'index.cjs';
        const requirePath = normalizePath(
          relative(config.rootDir, join(loaderBundle.dir, cjsEntryFile)),
        );
        npmPkgSet(`"exports[.][require]"="${requirePath}"`);
      }
    }
  }

  // Always ensure types is set correctly (from the types output target)
  if (types?.dir) {
    const typesFile = rootUsesEmptyLoaderIndex ? 'loader.d.ts' : 'index.d.ts';
    const typesPath = normalizePath(relative(config.rootDir, join(types.dir, typesFile)));
    npmPkgSet(`"exports[.][types]"="${typesPath}"`);
  }
};

/**
 * Check if the current root export import path is valid
 * (points to either loader-bundle or standalone output).
 * @param config The validated Stencil config
 * @param currentImport The current import path from exports["."]
 * @param loaderBundle The loader-bundle output target, if it exists
 * @param standalone The standalone output target, if it exists
 * @returns True if the current import path points to a valid output, false otherwise
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
 * Ensure a path has a relative prefix (./ or ../).
 * Handles cases where normalizePath/relative may or may not add the prefix.
 * @param path The path to ensure has a relative prefix
 * @returns The path with a relative prefix
 */
const ensureRelativePrefix = (path: string): string => {
  if (path.startsWith('./') || path.startsWith('../')) {
    return path;
  }
  return './' + path;
};

/**
 * Generate the loader export `exports["./loader"]`.
 *
 * Points directly to the esm/loader.js file in the loader-bundle output.
 * No separate loader directory is generated - package.json exports handle the mapping.
 *
 * @param config The validated Stencil config
 * @param loaderBundle The loader-bundle output target
 * @param types The types output target, if it exists
 * @param npmPkgSet Function used to run `npm pkg set`, tolerating an unavailable npm CLI
 */
const generateLoaderExport = (
  config: d.ValidatedConfig,
  loaderBundle: d.OutputTargetLoaderBundle,
  types: d.OutputTargetTypes | undefined,
  npmPkgSet: NpmPkgSet,
): void => {
  const esmDir = join(loaderBundle.dir, 'esm');
  const esmLoaderPath = ensureRelativePrefix(
    normalizePath(relative(config.rootDir, join(esmDir, 'loader.js'))),
  );

  npmPkgSet(`"exports[./loader][import]"="${esmLoaderPath}"`);

  // Set CJS require path if CJS is enabled
  if (loaderBundle.cjs) {
    const cjsDir = join(loaderBundle.dir, 'cjs');
    const cjsLoaderPath = ensureRelativePrefix(
      normalizePath(relative(config.rootDir, join(cjsDir, 'loader.cjs'))),
    );
    npmPkgSet(`"exports[./loader][require]"="${cjsLoaderPath}"`);
  }

  // Types for the loader entry point
  if (types?.dir) {
    const typesPath = ensureRelativePrefix(
      normalizePath(relative(config.rootDir, join(types.dir, 'loader.d.ts'))),
    );
    npmPkgSet(`"exports[./loader][types]"="${typesPath}"`);
  }
};

/**
 * Generate per-component exports for standalone output.
 * Each component gets its own subpath export: `exports["./my-component"]`
 * @param config The validated Stencil config
 * @param buildCtx The build context containing the components to generate export maps for
 * @param standalone The standalone output target
 * @param npmPkgSet Function used to run `npm pkg set`, tolerating an unavailable npm CLI
 */
const generateComponentExports = (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  standalone: d.OutputTargetStandalone,
  npmPkgSet: NpmPkgSet,
): void => {
  let outDir = relative(config.rootDir, standalone.dir!);
  if (!outDir.startsWith('.')) {
    outDir = './' + outDir;
  }

  buildCtx.components.forEach((cmp) => {
    npmPkgSet(`"exports[./${cmp.tagName}][import]"="${outDir}/${cmp.tagName}.js"`);
    npmPkgSet(`"exports[./${cmp.tagName}][types]"="${outDir}/${cmp.tagName}.d.ts"`);
  });
};
