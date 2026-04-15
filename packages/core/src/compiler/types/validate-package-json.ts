import type * as d from '@stencil/core';

import {
  isOutputTargetLoaderBundle,
  isOutputTargetStandalone,
  isOutputTargetTypes,
  isString,
  join,
  normalizePath,
  relative,
} from '../../utils';
import { packageJsonError, packageJsonWarn } from './package-json-log-utils';

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
export const getPackageJsonRecommendations = (
  config: d.ValidatedConfig,
): PackageJsonRecommendations => {
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
  if (loaderBundle?.dir && loaderBundle.cjs) {
    main = normalizePath(relative(config.rootDir, join(loaderBundle.dir, 'index.cjs.js')));
  }

  return { module, types: typesPath, main };
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
export const validatePackageJson = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): void => {
  // Only validate if the user has opted in
  if (!config.validatePackageJson) {
    return;
  }

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
};

/**
 * Validates the "module" field in package.json.
 * @param config The Stencil config
 * @param compilerCtx The compiler context
 * @param buildCtx The build context
 * @param recommendedPath The recommended path for the "module" field based on the output targets
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
 * @param config The Stencil config
 * @param compilerCtx The compiler context
 * @param buildCtx The build context
 * @param recommendedPath The recommended path for the "types" field based on the types output target
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
