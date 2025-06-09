import { buildWarn, isEligiblePrimaryPackageOutputTarget, isString, join, normalizePath, relative } from '@utils';

import type * as d from '../../declarations';
import { packageJsonError, packageJsonWarn } from './package-json-log-utils';

/**
 * Contains utility methods that can be used to generate recommended values for a
 * project's `package.json` fields that get validated for output targets designated
 * as `isPrimaryPackageOutputTarget`.
 */
export type PrimaryPackageOutputTargetRecommendedConfig = {
  /**
   * Generates the recommended path for the `module` property based on the output target type,
   * the project's root directory, and the output target's designated output location.
   *
   * @param rootDir The Stencil project's root directory pulled from the validated config.
   * @param outputTargetDir The output directory for the output target's compiled code.
   * @returns The recommended path for the `module` property in a project's `package.json`
   */
  getModulePath: (rootDir: string, outputTargetDir: string) => string | null;
  /**
   * Generates the recommended path for the `types` property based on the output target type,
   * the project's root directory, and the output target's configuration.
   *
   * `outputTargetConfig` is typed as `any` because downstream consumers may run into type conflicts
   * with the `type` property of all the different "eligible" output targets.
   *
   * @param rootDir The Stencil project's root directory pulled from the validated config.
   * @param outputTargetConfig The output target's config.
   * @returns The recommended path for the `types` property in a project's `package.json`
   */
  getTypesPath: (rootDir: string, outputTargetConfig: any) => string | null;
  /**
   * Generates the recommended path for the `main` property based on the output target type,
   * the project's root directory, and the output target's designated output location.
   *
   * Only used for generate export maps.
   *
   * @param rootDir The Stencil project's root directory pulled from the validated config.
   * @param outputTargetDir The output directory for the output target's compiled code.
   * @returns The recommended path for the `main` property in a project's `package.json`
   */
  getMainPath: (rootDir: string, outputTargetDir: string) => string | null;
};

/**
 * Contains a `PrimaryPackageOutputTargetRecommendedConfig` for each output target
 * that can be marked as `isPrimaryPackageOutputTarget`. Each config defines how
 * it will generate recommended values for certain `package.json` fields.
 */
export const PRIMARY_PACKAGE_TARGET_CONFIGS = {
  dist: {
    getModulePath: (rootDir: string, outputTargetDir: string) =>
      normalizePath(relative(rootDir, join(outputTargetDir, 'index.js'))),
    getTypesPath: (rootDir: string, outputTargetConfig: any) =>
      normalizePath(relative(rootDir, join(outputTargetConfig.typesDir!, 'index.d.ts'))),
    getMainPath: (rootDir: string, outputTargetDir: string) =>
      normalizePath(relative(rootDir, join(outputTargetDir, 'index.cjs.js'))),
  },
  'dist-collection': {
    getModulePath: (rootDir: string, outputTargetDir: string) =>
      normalizePath(relative(rootDir, join(outputTargetDir, 'index.js'))),
    getTypesPath: () => null,
    getMainPath: () => null,
  },
  'dist-custom-elements': {
    getModulePath: (rootDir: string, outputTargetDir: string) =>
      normalizePath(relative(rootDir, join(outputTargetDir, 'index.js'))),
    getTypesPath: (rootDir: string, outputTargetConfig: any) => {
      return outputTargetConfig.generateTypeDeclarations
        ? normalizePath(relative(rootDir, join(outputTargetConfig.dir!, 'index.d.ts')))
        : null;
    },
    getMainPath: () => null,
  },
  'dist-types': {
    getModulePath: () => null,
    getTypesPath: (rootDir: string, outputTargetConfig: any) =>
      normalizePath(relative(rootDir, join(outputTargetConfig.typesDir, 'index.d.ts'))),
    getMainPath: () => null,
  },
} satisfies Record<d.EligiblePrimaryPackageOutputTarget['type'], PrimaryPackageOutputTargetRecommendedConfig>;

/**
 * Performs validation for specified fields in a Stencil project's
 * `package.json` based on output targets being designated as
 * `isPrimaryPackageOutputTarget`.
 *
 * @param config The Stencil project's config.
 * @param compilerCtx The project's compiler context.
 * @param buildCtx The project's build context.
 */
export const validatePrimaryPackageOutputTarget = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  if (config.validatePrimaryPackageOutputTarget) {
    const eligiblePrimaryTargets: d.EligiblePrimaryPackageOutputTarget[] = [];
    const nonPrimaryTargets: d.OutputTarget[] = [];

    // Push each output target in the config into its respective
    // classification for validation messages
    // Using a `foreach` prevents us from iterating over
    // the array multiple times
    config.outputTargets.forEach((ref) => {
      if (isEligiblePrimaryPackageOutputTarget(ref)) {
        eligiblePrimaryTargets.push(ref);
      } else {
        nonPrimaryTargets.push(ref);
      }
    });

    // If there are no output targets designated as "primary", then we should warn the user
    // to designate one. In this case, we aren't gonna do any validation
    if (eligiblePrimaryTargets.length) {
      const targetsMarkedToValidate = eligiblePrimaryTargets.filter((ref) => ref.isPrimaryPackageOutputTarget);

      if (targetsMarkedToValidate.length) {
        // A user should only designate one target to validate against
        // Log a warning if they try to have more than one, but we'll only validate
        // the first one in the array
        if (targetsMarkedToValidate.length > 1) {
          logValidationWarning(
            buildCtx,
            `Your Stencil config has multiple output targets with 'isPrimaryPackageOutputTarget: true'. Stencil does not support validating 'package.json' fields for multiple output targets. Please remove the 'isPrimaryPackageOutputTarget' flag from all but one of the following output targets: ${targetsMarkedToValidate
              .map((ref) => ref.type)
              .join(
                ', ',
              )}. For now, Stencil will use the first primary target it finds. You can read more about primary package output targets in the Stencil docs: https://stenciljs.com/docs/output-targets#primary-package-output-target-validation`,
          );
        }

        // Validate shared fields
        // Currently, this is only `module` and `types`
        // We only validate the first target that is designated
        const targetToValidate = targetsMarkedToValidate[0];
        const recommendedConfig = PRIMARY_PACKAGE_TARGET_CONFIGS[targetToValidate.type];
        if (recommendedConfig != null) {
          validateModulePath(config, compilerCtx, buildCtx, recommendedConfig, targetToValidate);
          validateTypesPath(config, compilerCtx, buildCtx, recommendedConfig, targetToValidate);
        }
      } else {
        logValidationWarning(
          buildCtx,
          `Your Stencil project has not assigned a primary package output target. Stencil recommends that you assign a primary output target so it can validate values for fields in your project's 'package.json'. You can read more about primary package output targets in the Stencil docs: https://stenciljs.com/docs/output-targets#primary-package-output-target-validation`,
        );
      }
    }

    // Log a warning if any targets that cannot be validated were marked as "primary"
    if (nonPrimaryTargets.length && nonPrimaryTargets.some((ref: any) => ref.isPrimaryPackageOutputTarget)) {
      logValidationWarning(
        buildCtx,
        `Your Stencil project has assigned one or more ineligible output targets as the primary package output target. No validation will take place. Please remove the 'isPrimaryPackageOutputTarget' flag from the following output targets in your Stencil config: ${nonPrimaryTargets
          .filter((ref: any) => ref.isPrimaryPackageOutputTarget === true)
          .map((ref) => ref.type)
          .join(
            ', ',
          )}. You can read more about primary package output targets in the Stencil docs: https://stenciljs.com/docs/output-targets#primary-package-output-target-validation`,
      );
    }
  } else {
    if (config.outputTargets.some((ref: any) => ref.isPrimaryPackageOutputTarget)) {
      logValidationWarning(
        buildCtx,
        'Your Stencil project has designated a primary package output target without enabling primary package validation for your project. Either set `validatePrimaryPackageOutputTarget: true` in your Stencil config or remove `isPrimaryPackageOutputTarget: true` from all output targets. You can read more about primary package output targets in the Stencil docs: https://stenciljs.com/docs/output-targets#primary-package-output-target-validation',
      );
    }
  }
};

/**
 * Validates the `module` field in a Stencil project's `package.json`. This function performs
 * basic checks for a value to be set for `module` as well as checks that the specified path
 * matches Stencil's recommended value based on the output target the user designated to be used
 * for validation (i.e. `isPrimaryPackageOutputTarget: true`).
 *
 * If a value does not exist or does not match the recommended path, a _warning_ will be logged to
 * the console at build time.
 *
 * @param config The Stencil project's config.
 * @param compilerCtx The project's compiler context.
 * @param buildCtx The project's build context.
 * @param recommendedOutputTargetConfig The config object containing the function to generate the Stencil
 * recommended value for the `module` path based on the output target type.
 * @param targetToValidate The output target to validate against.
 */
export const validateModulePath = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  recommendedOutputTargetConfig: PrimaryPackageOutputTargetRecommendedConfig,
  targetToValidate: d.EligiblePrimaryPackageOutputTarget,
) => {
  const currentModulePath = buildCtx.packageJson.module;
  const recommendedModulePath = recommendedOutputTargetConfig.getModulePath
    ? recommendedOutputTargetConfig.getModulePath(config.rootDir, targetToValidate.dir!)
    : null;

  let warningMessage: string | null = null;
  if (!isString(currentModulePath) || currentModulePath === '') {
    warningMessage = 'package.json "module" property is required when generating a distribution.';

    if (recommendedModulePath != null) {
      warningMessage += ` It's recommended to set the "module" property to: ${recommendedModulePath}`;
    }
  } else if (recommendedModulePath != null && recommendedModulePath !== normalizePath(currentModulePath)) {
    warningMessage = `package.json "module" property is set to "${currentModulePath}". It's recommended to set the "module" property to: ${recommendedModulePath}`;
  }

  if (warningMessage?.length) {
    packageJsonWarn(config, compilerCtx, buildCtx, warningMessage, `"module"`);
  }
};

/**
 * Validates the `types` field in a Stencil project's `package.json`. This function performs
 * basic checks for a value to be set for `types` as well as checks that the specified path
 * matches Stencil's recommended value based on the output target the user designated to be used
 * for validation (i.e. `isPrimaryPackageOutputTarget: true`).
 *
 * If a value does not exist or does not match the recommended path, a warning _or_ error will be logged to
 * the console at build time.
 *
 * @param config The Stencil project's config.
 * @param compilerCtx The project's compiler context.
 * @param buildCtx The project's build context.
 * @param recommendedOutputTargetConfig The config object containing the function to generate the Stencil
 * recommended value for the `types` path based on the output target type.
 * @param targetToValidate The output target to validate against.
 */
export const validateTypesPath = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  recommendedOutputTargetConfig: PrimaryPackageOutputTargetRecommendedConfig,
  targetToValidate: d.EligiblePrimaryPackageOutputTarget,
) => {
  const currentTypesPath = buildCtx.packageJson.types;
  const recommendedTypesPath = recommendedOutputTargetConfig.getTypesPath
    ? recommendedOutputTargetConfig.getTypesPath(config.rootDir, targetToValidate)
    : null;

  let warningMessage: string | null = null;
  let errorMessage: string | null = null;
  if (!isString(currentTypesPath) || currentTypesPath === '') {
    warningMessage = `package.json "types" property is required when generating a distribution. It's recommended to set the "types" property to: ${recommendedTypesPath}`;
  } else if (!currentTypesPath.endsWith('.d.ts')) {
    warningMessage = `package.json "types" file must have a ".d.ts" extension. The "types" property is currently set to: ${currentTypesPath}`;
  } else if (recommendedTypesPath != null && recommendedTypesPath !== normalizePath(currentTypesPath)) {
    warningMessage = `package.json "types" property is set to "${currentTypesPath}". It's recommended to set the "types" property to: ${recommendedTypesPath}`;
  } else {
    const typesFile = join(config.rootDir, currentTypesPath);
    const typesFileExists = compilerCtx.fs.accessSync(typesFile);
    if (!typesFileExists) {
      errorMessage = `package.json "types" property is set to "${currentTypesPath}" but cannot be found.`;
    }
  }

  if (errorMessage?.length) {
    packageJsonError(config, compilerCtx, buildCtx, errorMessage, `"types"`);
  } else if (warningMessage?.length) {
    packageJsonWarn(config, compilerCtx, buildCtx, warningMessage, `"types"`);
  }
};

const logValidationWarning = (buildCtx: d.BuildCtx, message: string) => {
  const warning = buildWarn(buildCtx.diagnostics);
  warning.header = 'Stencil Config';
  warning.messageText = message;
};
