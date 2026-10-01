import { dirname } from 'path';
import type * as d from '@stencil/core';

import {
  buildJsonFileError,
  COLLECTION_MANIFEST_FILE_NAME,
  GENERATED_DTS,
  isGlob,
  isOutputTargetAssets,
  isOutputTargetLoaderBundle,
  isOutputTargetStandalone,
  isOutputTargetCollection,
  isOutputTargetTypes,
  isString,
  join,
  normalizePath,
  relative,
} from '../../utils';

/**
 * Represents the recommended package.json field values based on configured output targets.
 */
interface PackageJsonRecommendations {
  /**
   * Recommended values for the "module" field (ESM entry points).
   * Contains paths for each configured output target that produces an entry point.
   */
  moduleOptions: string[];
  /**
   * Recommended values for the "types" field.
   * Contains paths based on configured output targets.
   */
  typesOptions: string[];
  /**
   * Recommended value for the "main" field (CJS entry point).
   * Only set if loader-bundle has cjs: true.
   */
  main: string | null;
  /**
   * Whether any output target produces CJS.
   * Used to determine if "type": "module" should be recommended.
   */
  hasCjsOutput: boolean;
}

/**
 * Auto-detect recommended package.json values based on configured output targets.
 *
 * In v5, output targets are peers - there's no "primary" output target.
 * Instead, recommendations are derived from which outputs are configured:
 * - `moduleOptions` contains entry points for each configured output (loader, standalone)
 * - `typesOptions`: index.d.ts (if src/index.ts exists), otherwise loader.d.ts and/or standalone.d.ts based on outputs
 * - `main` points to CJS output from loader-bundle (if cjs: true)
 *
 * @param config The validated Stencil configuration
 * @param compilerCtx The compiler context (for file system access)
 * @returns Recommended values for package.json fields
 */
const getPackageJsonRecommendations = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
): PackageJsonRecommendations => {
  const loaderBundle = config.outputTargets.find(isOutputTargetLoaderBundle);
  const standalone = config.outputTargets.find(isOutputTargetStandalone);
  const types = config.outputTargets.find(isOutputTargetTypes);

  // Without a src/index.ts, the loader-bundle's own index.js is just an
  // empty auto-generated stub - the real entry point is the esm/loader.js it forwards to.
  const srcIndexPath = join(config.srcDir, 'index.ts');
  const hasSrcIndex = compilerCtx.fs.accessSync(srcIndexPath);

  // moduleOptions: collect entry points from each configured output target
  const moduleOptions: string[] = [];

  // loader-bundle provides an entry at its dir (e.g. dist/loader-bundle/index.js),
  // falling back to the loader script itself when there's no user index.ts to bundle
  if (loaderBundle?.dir) {
    const loaderEntry = hasSrcIndex
      ? join(loaderBundle.dir, 'index.js')
      : join(loaderBundle.dir, 'esm', 'loader.js');
    moduleOptions.push(normalizePath(relative(config.rootDir, loaderEntry)));
  }

  // standalone provides an entry at its dir (defaults to dist/standalone)
  if (standalone?.dir) {
    moduleOptions.push(normalizePath(relative(config.rootDir, join(standalone.dir, 'index.js'))));
  }

  // typesOptions: collect valid type entry points in priority order
  // 1. index.d.ts if src/index.ts exists (user's defined package entry)
  // 2. loader.d.ts if loader-bundle output is configured
  // 3. standalone.d.ts if standalone output is configured
  // 4. components.d.ts as last resort (only if no other options)
  const typesOptions: string[] = [];
  if (types?.dir) {
    if (hasSrcIndex) {
      typesOptions.push(normalizePath(relative(config.rootDir, join(types.dir, 'index.d.ts'))));
    } else {
      // Add output-specific types files
      if (loaderBundle) {
        typesOptions.push(normalizePath(relative(config.rootDir, join(types.dir, 'loader.d.ts'))));
      }
      if (standalone) {
        typesOptions.push(
          normalizePath(relative(config.rootDir, join(types.dir, 'standalone.d.ts'))),
        );
      }
      // Fallback to components.d.ts only if no output targets configured
      if (typesOptions.length === 0) {
        typesOptions.push(normalizePath(relative(config.rootDir, join(types.dir, GENERATED_DTS))));
      }
    }
  }

  // main: only if loader-bundle has CJS enabled
  let main: string | null = null;
  const hasCjsOutput = !!loaderBundle?.cjs;
  if (loaderBundle?.dir && loaderBundle.cjs) {
    main = normalizePath(relative(config.rootDir, join(loaderBundle.dir, 'index.cjs')));
  }

  return { moduleOptions, typesOptions, main, hasCjsOutput };
};

/**
 * Collect the rootDir-relative directories of every configured output target that must
 * ship in the published npm package for consumers (and their tooling) to be able to use
 * it - as opposed to dev-only artifacts like `www`.
 * @param config The validated Stencil configuration
 * @param buildCtx The build context (used to check whether there are actually component
 * assets to copy - the `assets` output target is otherwise a no-op and its directory is
 * never written)
 * @returns a de-duplicated list of rootDir-relative directory paths
 */
const getDistributableOutputDirs = (config: d.ValidatedConfig, buildCtx: d.BuildCtx): string[] => {
  const loaderBundle = config.outputTargets.find(isOutputTargetLoaderBundle);
  const standalone = config.outputTargets.find(isOutputTargetStandalone);
  const types = config.outputTargets.find(isOutputTargetTypes);
  const collections = config.outputTargets.filter(isOutputTargetCollection);

  const hasAssets = buildCtx.components.some(
    (cmp) => cmp.assetsDirs != null && cmp.assetsDirs.length > 0,
  );
  const assets = hasAssets ? config.outputTargets.find(isOutputTargetAssets) : undefined;

  const dirs = [
    loaderBundle?.dir,
    standalone?.dir,
    types?.dir,
    assets?.dir,
    ...collections.map((c) => c.dir),
  ]
    .filter((dir): dir is string => !!dir)
    .map((dir) => normalizePath(relative(config.rootDir, dir)));

  return Array.from(new Set(dirs));
};

// ============================================================================
// Build-time validation (entry point)
// ============================================================================

/**
 * Validate the package.json file for a project, checking that various fields
 * are set correctly for the currently-configured output targets.
 *
 * This is the main entry point called during the build process.
 *
 * @param config the project's Stencil config
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @returns an empty Promise
 */
export const validateBuildPackageJson = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  if (config.watch || config.devMode || buildCtx.packageJson == null) {
    return;
  }

  // Validate core package.json fields based on configured output targets
  validatePackageJson(config, compilerCtx, buildCtx);

  // Validate that "files" covers every distributable output
  await validateFilesField(config, compilerCtx, buildCtx);

  // Validate the "collection" field pointer for each collection output target
  const stencilCollectionOutputTargets = config.outputTargets.filter(isOutputTargetCollection);
  stencilCollectionOutputTargets.forEach((stencilCollectionOT) =>
    validateCollectionField(config, compilerCtx, buildCtx, stencilCollectionOT),
  );
};

/**
 * Validates a project's package.json fields against recommended values
 * based on configured output targets.
 *
 * This replaces the old `validatePrimaryPackageOutputTarget` function.
 * Instead of requiring users to mark a "primary" output target,
 * validation is auto-detected based on which outputs are configured.
 *
 * @param config The Stencil project's config
 * @param compilerCtx The project's compiler context
 * @param buildCtx The project's build context
 */
const validatePackageJson = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): void => {
  const recommendations = getPackageJsonRecommendations(config, compilerCtx);

  // No distributable outputs configured - nothing to validate
  if (recommendations.moduleOptions.length === 0 && recommendations.typesOptions.length === 0) {
    return;
  }

  // Validate module field
  if (recommendations.moduleOptions.length > 0) {
    validateModuleField(config, compilerCtx, buildCtx, recommendations.moduleOptions);
  }

  // Validate types field
  if (recommendations.typesOptions.length > 0) {
    validateTypesField(config, compilerCtx, buildCtx, recommendations.typesOptions);
  }

  // Validate main field
  if (recommendations.main) {
    // CJS output is enabled - validate main is set correctly
    validateMainField(config, compilerCtx, buildCtx, recommendations.main);
  } else {
    // CJS output not enabled - but if main is set, check it exists
    validateMainFieldExists(config, compilerCtx, buildCtx);
  }

  // Validate type: "module" field
  validateTypeField(config, compilerCtx, buildCtx, recommendations);
};

// ============================================================================
// Field validators
// ============================================================================

/**
 * Formats module options for display in warning messages.
 * Single option: "./dist/loader/index.js"
 * Multiple options: "./dist/loader/index.js or ./dist/standalone/index.js"
 * @param options the module options to format
 * @returns a formatted string of module options for display in messages
 */
const formatModuleOptions = (options: string[]): string => {
  if (options.length === 1) {
    return options[0];
  }
  return options.join(' or ');
};

/**
 * Validates the "module" field in package.json.
 * Checks that the field exists and points to a file that will be generated.
 * @param config the current Stencil configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param moduleOptions the recommended module paths based on configured output targets
 */
const validateModuleField = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  moduleOptions: string[],
): void => {
  const currentModulePath = buildCtx.packageJson.module;
  const suggestion = formatModuleOptions(moduleOptions);

  if (!isString(currentModulePath) || currentModulePath === '') {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "module" property is required when generating a distribution. It's recommended to set the "module" property to: ${suggestion}`,
      '"module"',
    );
    return;
  }

  // Check if the current module path exists
  const moduleFile = join(config.rootDir, currentModulePath);
  const moduleFileExists = compilerCtx.fs.accessSync(moduleFile);

  if (!moduleFileExists) {
    // File doesn't exist - provide helpful message with recommendation
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "module" property is set to "${currentModulePath}" which doesn't exist. Consider setting it to: ${suggestion}`,
      '"module"',
    );
  }
  // If the file exists, don't warn even if it differs from recommendation
};

/**
 * Validates the "types" field in package.json.
 * Checks that the field exists, has a .d.ts extension, and points to a file that exists.
 * @param config the current Stencil configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param typesOptions the recommended paths for the "types" field based on configured output targets
 */
const validateTypesField = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  typesOptions: string[],
): void => {
  const currentTypesPath = buildCtx.packageJson.types;
  const suggestion = formatModuleOptions(typesOptions);

  if (!isString(currentTypesPath) || currentTypesPath === '') {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "types" property is required when generating a distribution. It's recommended to set the "types" property to: ${suggestion}`,
      '"types"',
    );
    return;
  }

  if (!currentTypesPath.endsWith('.d.ts')) {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "types" file must have a ".d.ts" extension. The "types" property is currently set to: ${currentTypesPath}`,
      '"types"',
    );
    return;
  }

  // Check if the types file exists - this is the primary validation
  const typesFile = join(config.rootDir, currentTypesPath);
  const typesFileExists = compilerCtx.fs.accessSync(typesFile);

  if (!typesFileExists) {
    // File doesn't exist - provide helpful message with recommendation
    packageJsonError(
      config,
      compilerCtx,
      buildCtx,
      `package.json "types" property is set to "${currentTypesPath}" which doesn't exist. Consider setting it to: ${suggestion}`,
      '"types"',
    );
  }
  // If the file exists, don't warn even if it differs from recommendation
};

/**
 * Validates the "main" field in package.json.
 * Called when CJS output is being generated - checks that main is set correctly.
 * @param config the current Stencil configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param recommendedPath the recommended path for the main field based on output targets
 */
const validateMainField = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  recommendedPath: string,
): void => {
  const currentMainPath = buildCtx.packageJson.main;

  if (!isString(currentMainPath) || currentMainPath === '') {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "main" property is recommended when generating CJS output. Set it to: ${recommendedPath}`,
      '"main"',
    );
    return;
  }

  // Check if the current main path exists
  const mainFile = join(config.rootDir, currentMainPath);
  const mainFileExists = compilerCtx.fs.accessSync(mainFile);

  if (!mainFileExists) {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "main" property is set to "${currentMainPath}" which doesn't exist. Consider setting it to: ${recommendedPath}`,
      '"main"',
    );
  }
};

/**
 * Validates that if "main" is set in package.json, the file actually exists.
 * This is called regardless of whether CJS output is configured.
 * @param config the current Stencil configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 */
const validateMainFieldExists = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): void => {
  const currentMainPath = buildCtx.packageJson.main;

  if (!isString(currentMainPath) || currentMainPath === '') {
    return; // No main field set, nothing to validate
  }

  // Check if the current main path exists
  const mainFile = join(config.rootDir, currentMainPath);
  const mainFileExists = compilerCtx.fs.accessSync(mainFile);

  if (!mainFileExists) {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "main" property is set to "${currentMainPath}" which doesn't exist.`,
      '"main"',
    );
  }
};

/**
 * Validates the "type" field in package.json.
 *
 * In v5, we always recommend "type": "module" when generating distributable outputs.
 * @param config the current Stencil configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param recommendations the recommended package.json field values based on configured output targets
 */
const validateTypeField = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  recommendations: PackageJsonRecommendations,
): void => {
  const currentType = buildCtx.packageJson.type;

  // Always recommend "type": "module" when generating distributable outputs
  // CJS output uses .cjs extension which works regardless of "type" field
  if (recommendations.moduleOptions.length > 0 && currentType !== 'module') {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "type" property should be set to "module".`,
      '"type"',
    );
  }
};

// ============================================================================
// "files" field validation
// ============================================================================

/**
 * Check if a rootDir-relative directory is covered by a package.json `files` array,
 * either directly or via a parent directory entry (e.g. "dist/" covers "dist/types/").
 * @param files the package.json "files" array
 * @param dir the rootDir-relative directory to check for
 * @returns true if `dir` is covered by one of the `files` entries
 */
const isDirCoveredByFiles = (files: string[], dir: string): boolean => {
  const normalizedDir = dir.replace(/\/$/, '').replace(/^\.\//, '');

  return files.some((userPath) => {
    const normalizedUserPath = normalizePath(userPath).replace(/\/$/, '').replace(/^\.\//, '');

    if (normalizedUserPath === normalizedDir) {
      return true;
    }

    const userPathWithSlash = normalizedUserPath + '/';
    return normalizedDir.startsWith(userPathWithSlash);
  });
};

/**
 * Validate that the `files` field in `package.json` covers every distributable output
 * directory (loader-bundle, standalone, types, collection) - not just one of them -
 * since `npm publish` needs all of them to produce a working package for consumers.
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 */
const validateFilesField = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  const distDirs = getDistributableOutputDirs(config, buildCtx);
  if (distDirs.length === 0) {
    return;
  }

  const formatDirs = (dirs: string[]): string => dirs.map((dir) => `"${dir}/"`).join(', ');

  if (!Array.isArray(buildCtx.packageJson.files)) {
    // Without a "files" array (and no .npmignore), `npm publish` falls back to
    // .gitignore to decide what to include - silently dropping gitignored dist
    // directories from the published package.
    const npmignorePath = join(dirname(config.packageJsonFilePath), '.npmignore');
    const hasNpmignore = await compilerCtx.fs.access(npmignorePath);
    if (!hasNpmignore) {
      const msg = `package.json is missing a "files" array. Without one, "npm publish" falls back to ".gitignore" to decide what to include, which will likely exclude ${distDirs.length > 1 ? 'the distribution directories' : 'the distribution directory'} ${formatDirs(distDirs)}. Add a "files" array covering ${distDirs.length > 1 ? 'them' : 'it'} to package.json (or add a ".npmignore").`;
      packageJsonWarn(config, compilerCtx, buildCtx, msg, `"files"`);
    }
    return;
  }

  const files = buildCtx.packageJson.files;
  const uncoveredDirs = distDirs.filter((dir) => !isDirCoveredByFiles(files, dir));

  if (uncoveredDirs.length > 0) {
    const msg = `package.json "files" array must contain the distribution ${uncoveredDirs.length > 1 ? 'directories' : 'directory'} ${formatDirs(uncoveredDirs)} when generating a distribution.`;
    packageJsonWarn(config, compilerCtx, buildCtx, msg, `"files"`);
    return;
  }

  await Promise.all(
    files.map(async (pkgFile) => {
      if (!isGlob(pkgFile)) {
        const packageJsonDir = dirname(config.packageJsonFilePath);
        const absPath = join(packageJsonDir, pkgFile);

        const hasAccess = await compilerCtx.fs.access(absPath);
        if (!hasAccess) {
          const msg = `Unable to find "${pkgFile}" within the package.json "files" array.`;
          packageJsonError(config, compilerCtx, buildCtx, msg, `"${pkgFile}"`);
        }
      }
    }),
  );
};

// ============================================================================
// Stencil collection specific validation
// ============================================================================

/**
 * Check that the `collection` field is set correctly in `package.json` for the
 * `collection` output target.
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param outputTarget the output target to validate against
 */
const validateCollectionField = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetCollection,
) => {
  if (outputTarget.dir) {
    const collectionRel = normalizePath(
      join(relative(config.rootDir, outputTarget.dir), COLLECTION_MANIFEST_FILE_NAME),
      false,
    );
    if (
      !buildCtx.packageJson.collection ||
      normalizePath(buildCtx.packageJson.collection, false) !== collectionRel
    ) {
      const msg = `package.json "collection" property should be set to ${collectionRel} when generating a distribution bundle.`;
      packageJsonWarn(config, compilerCtx, buildCtx, msg, `"collection"`);
    }
  }
};

// ============================================================================
// Logging utilities
// ============================================================================

/**
 * Build a diagnostic for an error resulting from a particular field in a
 * package.json file
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param msg the error message to display
 * @param jsonField the specific package.json field related to the error (e.g. "module", "types", etc.)
 * @returns a Diagnostic object representing the error
 */
const packageJsonError = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  msg: string,
  jsonField: string,
): d.Diagnostic => {
  const err = buildJsonFileError(
    compilerCtx,
    buildCtx.diagnostics,
    config.packageJsonFilePath,
    msg,
    jsonField,
  );
  err.header = `Package Json`;
  return err;
};

/**
 * Build a diagnostic for a warning resulting from a particular field in a
 * package.json file
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param msg the warning message to display
 * @param jsonField the specific package.json field related to the warning (e.g. "module", "types", etc.)
 * @returns a Diagnostic object representing the warning
 */
const packageJsonWarn = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  msg: string,
  jsonField: string,
): d.Diagnostic => {
  const warn = buildJsonFileError(
    compilerCtx,
    buildCtx.diagnostics,
    config.packageJsonFilePath,
    msg,
    jsonField,
  );
  warn.header = `Package Json`;
  warn.level = 'warn';
  return warn;
};
