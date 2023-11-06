import { createNodeLogger, createNodeSys } from '@sys-api-node';
import { buildError, isBoolean, isNumber, isString, sortBy } from '@utils';

import {
  ConfigBundle,
  ConfigExtras,
  Diagnostic,
  LoadConfigInit,
  LogLevel,
  UnvalidatedConfig,
  ValidatedConfig,
} from '../../declarations';
import { setBooleanConfig } from './config-utils';
import { validateOutputTargets } from './outputs';
import { validateDevServer } from './validate-dev-server';
import { validateHydrated } from './validate-hydrated';
import { validateDistNamespace } from './validate-namespace';
import { validateNamespace } from './validate-namespace';
import { validatePaths } from './validate-paths';
import { validatePlugins } from './validate-plugins';
import { validateRollupConfig } from './validate-rollup-config';
import { validateTesting } from './validate-testing';
import { validateWorkers } from './validate-workers';

/**
 * Represents the results of validating a previously unvalidated configuration
 */
type ConfigValidationResults = {
  /**
   * The validated configuration, with well-known default values set if they weren't previously provided
   */
  config: ValidatedConfig;
  /**
   * A collection of errors and warnings that occurred during the configuration validation process
   */
  diagnostics: Diagnostic[];
};

/**
 * We never really want to re-run validation for a Stencil configuration.
 * Besides the cost of doing so, our validation pipeline is unfortunately not
 * idempotent, so we want to have a guarantee that even if we call
 * {@link validateConfig} in a few places that the same configuration object
 * won't be passed through multiple times. So we cache the result of our work
 * here.
 */
let CACHED_VALIDATED_CONFIG: ValidatedConfig | null = null;

/**
 * Validate a Config object, ensuring that all its field are present and
 * consistent with our expectations. This function transforms an
 * {@link UnvalidatedConfig} to a {@link ValidatedConfig}.
 *
 * **NOTE**: this function _may_ return a previously-cached configuration
 * object. It will do so if the cached object is `===` to the one passed in.
 *
 * @param userConfig an unvalidated config that we've gotten from a user
 * @param bootstrapConfig the initial configuration provided by the user (or
 * generated by Stencil) used to bootstrap configuration loading and validation
 * @returns an object with config and diagnostics props
 */
export const validateConfig = (
  userConfig: UnvalidatedConfig = {},
  bootstrapConfig: LoadConfigInit,
): ConfigValidationResults => {
  const diagnostics: Diagnostic[] = [];

  if (CACHED_VALIDATED_CONFIG !== null && CACHED_VALIDATED_CONFIG === userConfig) {
    // We've previously done the work to validate a Stencil config. Since our
    // overall validation pipeline is unfortunately not idempotent we do not
    // want to simply validate again. Leaving aside the performance
    // implications of needlessly repeating the validation, we don't want to do
    // certain operations multiple times.
    //
    // For the sake of correctness we check both that the cache is not null and
    // that it's the same object as the one passed in.
    return {
      config: userConfig as ValidatedConfig,
      diagnostics,
    };
  }

  const config = Object.assign({}, userConfig);

  const logger = bootstrapConfig.logger || config.logger || createNodeLogger();

  // flags _should_ be JSON safe here
  //
  // we access `'flags'` on validated config to avoid having to introduce an
  // import of the CLI module
  const flags: ValidatedConfig['flags'] = JSON.parse(JSON.stringify(config.flags || {}));

  // default level is 'info'
  let logLevel: LogLevel = 'info';
  if (flags.debug || flags.verbose) {
    logLevel = 'debug';
  } else if (flags.logLevel) {
    logLevel = flags.logLevel;
  }

  logger.setLevel(logLevel);

  const validatedConfig: ValidatedConfig = {
    devServer: {}, // assign `devServer` before spreading `config`, in the event 'devServer' is not a key on `config`
    ...config,
    extras: config.extras || {},
    flags,
    hydratedFlag: validateHydrated(config),
    logLevel,
    logger,
    outputTargets: config.outputTargets ?? [],
    rollupConfig: validateRollupConfig(config),
    sys: config.sys ?? bootstrapConfig.sys ?? createNodeSys({ logger }),
    testing: config.testing ?? {},
    transformAliasedImportPaths: isBoolean(userConfig.transformAliasedImportPaths)
      ? userConfig.transformAliasedImportPaths
      : true,
    validatePrimaryPackageOutputTarget: userConfig.validatePrimaryPackageOutputTarget ?? false,
    ...validateNamespace(config.namespace, config.fsNamespace, diagnostics),
    ...validatePaths(config),
  };

  // default devMode false
  if (validatedConfig.flags.prod) {
    validatedConfig.devMode = false;
  } else if (validatedConfig.flags.dev) {
    validatedConfig.devMode = true;
  } else if (!isBoolean(validatedConfig.devMode)) {
    validatedConfig.devMode = DEFAULT_DEV_MODE;
  }

  validatedConfig.extras.lifecycleDOMEvents = !!validatedConfig.extras.lifecycleDOMEvents;
  validatedConfig.extras.scriptDataOpts = !!validatedConfig.extras.scriptDataOpts;
  validatedConfig.extras.initializeNextTick = !!validatedConfig.extras.initializeNextTick;
  validatedConfig.extras.tagNameTransform = !!validatedConfig.extras.tagNameTransform;

  // TODO(STENCIL-914): remove when `experimentalSlotFixes` is the default behavior
  // If the user set `experimentalSlotFixes` and any individual slot fix flags to `false`, we need to log a warning
  // to the user that we will "override" the individual flags
  if (validatedConfig.extras.experimentalSlotFixes === true) {
    const possibleFlags: (keyof ConfigExtras)[] = [
      'appendChildSlotFix',
      'slotChildNodesFix',
      'cloneNodeFix',
      'scopedSlotTextContentFix',
    ];
    const conflictingFlags = possibleFlags.filter((flag) => validatedConfig.extras[flag] === false);
    if (conflictingFlags.length > 0) {
      const warning = buildError(diagnostics);
      warning.level = 'warn';
      warning.messageText = `If the 'experimentalSlotFixes' flag is enabled it will override any slot fix flags which are disabled. In particular, the following currently-disabled flags will be ignored: ${conflictingFlags.join(
        ', ',
      )}. Please update your Stencil config accordingly.`;
    }
  }

  // TODO(STENCIL-914): remove `experimentalSlotFixes` when it's the default behavior
  validatedConfig.extras.experimentalSlotFixes = !!validatedConfig.extras.experimentalSlotFixes;
  if (validatedConfig.extras.experimentalSlotFixes === true) {
    validatedConfig.extras.appendChildSlotFix = true;
    validatedConfig.extras.cloneNodeFix = true;
    validatedConfig.extras.slotChildNodesFix = true;
    validatedConfig.extras.scopedSlotTextContentFix = true;
  } else {
    validatedConfig.extras.appendChildSlotFix = !!validatedConfig.extras.appendChildSlotFix;
    validatedConfig.extras.cloneNodeFix = !!validatedConfig.extras.cloneNodeFix;
    validatedConfig.extras.slotChildNodesFix = !!validatedConfig.extras.slotChildNodesFix;
    validatedConfig.extras.scopedSlotTextContentFix = !!validatedConfig.extras.scopedSlotTextContentFix;
  }

  validatedConfig.buildEs5 =
    validatedConfig.buildEs5 === true || (!validatedConfig.devMode && validatedConfig.buildEs5 === 'prod');

  setBooleanConfig(validatedConfig, 'minifyCss', null, !validatedConfig.devMode);
  setBooleanConfig(validatedConfig, 'minifyJs', null, !validatedConfig.devMode);
  setBooleanConfig(
    validatedConfig,
    'sourceMap',
    null,
    typeof validatedConfig.sourceMap === 'undefined' ? true : validatedConfig.sourceMap,
  );
  setBooleanConfig(validatedConfig, 'watch', 'watch', false);
  setBooleanConfig(validatedConfig, 'buildDocs', 'docs', !validatedConfig.devMode);
  setBooleanConfig(validatedConfig, 'buildDist', 'esm', !validatedConfig.devMode || validatedConfig.buildEs5);
  setBooleanConfig(validatedConfig, 'profile', 'profile', validatedConfig.devMode);
  setBooleanConfig(validatedConfig, 'writeLog', 'log', false);
  setBooleanConfig(validatedConfig, 'buildAppCore', null, true);
  setBooleanConfig(validatedConfig, 'autoprefixCss', null, validatedConfig.buildEs5);
  setBooleanConfig(validatedConfig, 'validateTypes', null, !validatedConfig._isTesting);
  setBooleanConfig(validatedConfig, 'allowInlineScripts', null, true);

  if (!isString(validatedConfig.taskQueue)) {
    validatedConfig.taskQueue = 'async';
  }

  // hash file names
  if (!isBoolean(validatedConfig.hashFileNames)) {
    validatedConfig.hashFileNames = !validatedConfig.devMode;
  }
  if (!isNumber(validatedConfig.hashedFileNameLength)) {
    validatedConfig.hashedFileNameLength = DEFAULT_HASHED_FILENAME_LENTH;
  }
  if (validatedConfig.hashedFileNameLength < MIN_HASHED_FILENAME_LENTH) {
    const err = buildError(diagnostics);
    err.messageText = `validatedConfig.hashedFileNameLength must be at least ${MIN_HASHED_FILENAME_LENTH} characters`;
  }
  if (validatedConfig.hashedFileNameLength > MAX_HASHED_FILENAME_LENTH) {
    const err = buildError(diagnostics);
    err.messageText = `validatedConfig.hashedFileNameLength cannot be more than ${MAX_HASHED_FILENAME_LENTH} characters`;
  }
  if (!validatedConfig.env) {
    validatedConfig.env = {};
  }

  // outputTargets
  validateOutputTargets(validatedConfig, diagnostics);

  // plugins
  validatePlugins(validatedConfig, diagnostics);

  // dev server
  validatedConfig.devServer = validateDevServer(validatedConfig, diagnostics);

  // testing
  validateTesting(validatedConfig, diagnostics);

  // bundles
  if (Array.isArray(validatedConfig.bundles)) {
    validatedConfig.bundles = sortBy(validatedConfig.bundles, (a: ConfigBundle) => a.components.length);
  } else {
    validatedConfig.bundles = [];
  }

  // validate how many workers we can use
  validateWorkers(validatedConfig);

  // default devInspector to whatever devMode is
  setBooleanConfig(validatedConfig, 'devInspector', null, validatedConfig.devMode);

  if (!validatedConfig._isTesting) {
    validateDistNamespace(validatedConfig, diagnostics);
  }

  setBooleanConfig(validatedConfig, 'enableCache', 'cache', true);

  if (!Array.isArray(validatedConfig.watchIgnoredRegex) && validatedConfig.watchIgnoredRegex != null) {
    validatedConfig.watchIgnoredRegex = [validatedConfig.watchIgnoredRegex];
  }
  validatedConfig.watchIgnoredRegex = ((validatedConfig.watchIgnoredRegex as RegExp[]) || []).reduce((arr, reg) => {
    if (reg instanceof RegExp) {
      arr.push(reg);
    }
    return arr;
  }, [] as RegExp[]);

  CACHED_VALIDATED_CONFIG = validatedConfig;

  return {
    config: validatedConfig,
    diagnostics,
  };
};

const DEFAULT_DEV_MODE = false;
const DEFAULT_HASHED_FILENAME_LENTH = 8;
const MIN_HASHED_FILENAME_LENTH = 4;
const MAX_HASHED_FILENAME_LENTH = 32;
