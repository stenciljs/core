import { dirname } from 'path';
import type * as d from '@stencil/core';

import {
  buildJsonFileError,
  COLLECTION_MANIFEST_FILE_NAME,
  isGlob,
  isOutputTargetLoaderBundle,
  isOutputTargetStandalone,
  isOutputTargetStencilRebundle,
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
   * Recommended value for the "module" field (ESM entry point).
   * Priority: loader-bundle > standalone
   */
  module: string | null;
  /**
   * Recommended value for the "types" field.
   * Always points to the types output target directory.
   */
  types: string | null;
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
 * - `module` points to loader-bundle (if present) or standalone
 * - `types` always points to the types output target
 * - `main` points to CJS output from loader-bundle (if cjs: true)
 *
 * @param config The validated Stencil configuration
 * @returns Recommended values for package.json fields
 */
const getPackageJsonRecommendations = (config: d.ValidatedConfig): PackageJsonRecommendations => {
  const loaderBundle = config.outputTargets.find(isOutputTargetLoaderBundle);
  const standalone = config.outputTargets.find(isOutputTargetStandalone);
  const types = config.outputTargets.find(isOutputTargetTypes);

  // module: prefer loader-bundle, fall back to standalone
  let module: string | null = null;
  if (loaderBundle?.dir) {
    module = normalizePath(relative(config.rootDir, join(loaderBundle.dir, 'index.js')));
  } else if (standalone?.dir) {
    module = normalizePath(relative(config.rootDir, join(standalone.dir, 'index.js')));
  }

  // types: always from the types output target
  let typesPath: string | null = null;
  if (types?.dir) {
    typesPath = normalizePath(relative(config.rootDir, join(types.dir, 'index.d.ts')));
  }

  // main: only if loader-bundle has CJS enabled
  let main: string | null = null;
  const hasCjsOutput = !!(loaderBundle?.cjs);
  if (loaderBundle?.dir && loaderBundle.cjs) {
    main = normalizePath(relative(config.rootDir, join(loaderBundle.dir, 'index.cjs.js')));
  }

  return { module, types: typesPath, main, hasCjsOutput };
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
  if (config.watch || buildCtx.packageJson == null) {
    return;
  }

  // Validate core package.json fields based on configured output targets
  validatePackageJson(config, compilerCtx, buildCtx);

  // Validate stencil-rebundle specific fields
  const stencilRebundleOutputTargets = config.outputTargets.filter(isOutputTargetStencilRebundle);
  await Promise.all(
    stencilRebundleOutputTargets.map((stencilRebundleOT) =>
      validateStencilRebundleFields(config, compilerCtx, buildCtx, stencilRebundleOT),
    ),
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
  const recommendations = getPackageJsonRecommendations(config);

  // No distributable outputs configured - nothing to validate
  if (!recommendations.module && !recommendations.types) {
    return;
  }

  // Validate module field
  if (recommendations.module) {
    validateModuleField(config, compilerCtx, buildCtx, recommendations.module);
  }

  // Validate types field
  if (recommendations.types) {
    validateTypesField(config, compilerCtx, buildCtx, recommendations.types);
  }

  // Validate main field (only if CJS output is enabled)
  if (recommendations.main) {
    validateMainField(config, compilerCtx, buildCtx, recommendations.main);
  }

  // Validate type: "module" field
  validateTypeField(config, compilerCtx, buildCtx, recommendations);
};

// ============================================================================
// Field validators
// ============================================================================

/**
 * Validates the "module" field in package.json.
 */
const validateModuleField = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  recommendedPath: string,
): void => {
  const currentModulePath = buildCtx.packageJson.module;

  if (!isString(currentModulePath) || currentModulePath === '') {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "module" property is required when generating a distribution. It's recommended to set the "module" property to: ${recommendedPath}`,
      '"module"',
    );
  } else if (normalizePath(currentModulePath) !== normalizePath(recommendedPath)) {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "module" property is set to "${currentModulePath}". It's recommended to set the "module" property to: ${recommendedPath}`,
      '"module"',
    );
  }
};

/**
 * Validates the "types" field in package.json.
 */
const validateTypesField = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  recommendedPath: string,
): void => {
  const currentTypesPath = buildCtx.packageJson.types;

  if (!isString(currentTypesPath) || currentTypesPath === '') {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "types" property is required when generating a distribution. It's recommended to set the "types" property to: ${recommendedPath}`,
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

  if (normalizePath(currentTypesPath) !== normalizePath(recommendedPath)) {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "types" property is set to "${currentTypesPath}". It's recommended to set the "types" property to: ${recommendedPath}`,
      '"types"',
    );
    return;
  }

  // Check if the types file exists
  const typesFile = join(config.rootDir, currentTypesPath);
  const typesFileExists = compilerCtx.fs.accessSync(typesFile);
  if (!typesFileExists) {
    packageJsonError(
      config,
      compilerCtx,
      buildCtx,
      `package.json "types" property is set to "${currentTypesPath}" but cannot be found.`,
      '"types"',
    );
  }
};

/**
 * Validates the "main" field in package.json.
 * Only relevant when CJS output is enabled.
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
  } else if (normalizePath(currentMainPath) !== normalizePath(recommendedPath)) {
    packageJsonWarn(
      config,
      compilerCtx,
      buildCtx,
      `package.json "main" property is set to "${currentMainPath}". For CJS output, it's recommended to set "main" to: ${recommendedPath}`,
      '"main"',
    );
  }
};

/**
 * Validates the "type" field in package.json.
 *
 * - If no CJS output: recommend "type": "module"
 * - If CJS output exists: "type": "module" is optional but still valid
 */
const validateTypeField = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  recommendations: PackageJsonRecommendations,
): void => {
  const currentType = buildCtx.packageJson.type;

  // If no CJS output, recommend "type": "module"
  if (!recommendations.hasCjsOutput && recommendations.module) {
    if (currentType !== 'module') {
      packageJsonWarn(
        config,
        compilerCtx,
        buildCtx,
        `package.json "type" property should be set to "module" when only generating ESM output. This enables native ES module resolution.`,
        '"type"',
      );
    }
  }

  // If CJS output exists and type is "module", that's fine - Node handles .cjs extensions
  // No warning needed in this case
};

// ============================================================================
// Stencil-rebundle specific validation
// ============================================================================

/**
 * Validate package.json contents specific to the `stencil-rebundle` output target,
 * checking that the `files` array and `stencilRebundle` field are set correctly.
 */
const validateStencilRebundleFields = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetStencilRebundle,
) => {
  await Promise.all([
    validatePackageFiles(config, compilerCtx, buildCtx, outputTarget),
    validateStencilRebundleField(config, compilerCtx, buildCtx, outputTarget),
  ]);
};

/**
 * Validate that the `files` field in `package.json` contains directories and
 * files that are necessary for the `stencil-rebundle` output target.
 */
const validatePackageFiles = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetStencilRebundle,
) => {
  if (!config.devMode && Array.isArray(buildCtx.packageJson.files)) {
    const actualDistDir = normalizePath(relative(config.rootDir, outputTarget.dir));

    const validPaths = [`${actualDistDir}`, `${actualDistDir}/`, `./${actualDistDir}`, `./${actualDistDir}/`];

    const containsDistDir = buildCtx.packageJson.files.some((userPath) =>
      validPaths.some((validPath) => normalizePath(userPath) === validPath),
    );

    if (!containsDistDir) {
      const msg = `package.json "files" array must contain the distribution directory "${actualDistDir}/" when generating a distribution.`;
      packageJsonWarn(config, compilerCtx, buildCtx, msg, `"files"`);
      return;
    }

    await Promise.all(
      buildCtx.packageJson.files.map(async (pkgFile) => {
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
  }
};

/**
 * Check that the `stencilRebundle` field is set correctly in `package.json` for the
 * `stencil-rebundle` output target.
 */
const validateStencilRebundleField = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetStencilRebundle,
) => {
  if (outputTarget.dir) {
    const rebundleRel = normalizePath(
      join(relative(config.rootDir, outputTarget.dir), COLLECTION_MANIFEST_FILE_NAME),
      false,
    );
    if (!buildCtx.packageJson.stencilRebundle || normalizePath(buildCtx.packageJson.stencilRebundle, false) !== rebundleRel) {
      const msg = `package.json "stencilRebundle" property is required when generating a distribution and must be set to: ${rebundleRel}`;
      packageJsonWarn(config, compilerCtx, buildCtx, msg, `"stencilRebundle"`);
    }
  }
};

// ============================================================================
// Logging utilities
// ============================================================================

/**
 * Build a diagnostic for an error resulting from a particular field in a
 * package.json file
 */
const packageJsonError = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  msg: string,
  jsonField: string,
): d.Diagnostic => {
  const err = buildJsonFileError(compilerCtx, buildCtx.diagnostics, config.packageJsonFilePath, msg, jsonField);
  err.header = `Package Json`;
  return err;
};

/**
 * Build a diagnostic for a warning resulting from a particular field in a
 * package.json file
 */
const packageJsonWarn = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  msg: string,
  jsonField: string,
): d.Diagnostic => {
  const warn = buildJsonFileError(compilerCtx, buildCtx.diagnostics, config.packageJsonFilePath, msg, jsonField);
  warn.header = `Package Json`;
  warn.level = 'warn';
  return warn;
};
