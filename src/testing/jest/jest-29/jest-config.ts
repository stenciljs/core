import type { Config } from '@jest/types';
import { BOOLEAN_CLI_FLAGS } from '@stencil/core/cli';
import type * as d from '@stencil/core/internal';
import { isString } from '@utils';

import { Jest29Stencil } from './jest-facade';

/**
 * Builds the `argv` to be used when programmatically invoking the Jest CLI
 * @param config the Stencil config to use while generating Jest CLI arguments
 * @returns the arguments to pass to the Jest CLI, wrapped in an object
 */
export function buildJestArgv(config: d.ValidatedConfig): Config.Argv {
  const yargs = require('yargs');

  const knownArgs = config.flags.knownArgs.slice();

  if (!knownArgs.some((a) => a.startsWith('--max-workers') || a.startsWith('--maxWorkers'))) {
    knownArgs.push(`--max-workers=${config.maxConcurrentWorkers}`);
  }

  if (config.flags.devtools) {
    knownArgs.push('--runInBand');
  }

  // we combine the modified args and the unknown args here and declare the
  // result read only, providing some type system-level assurance that we won't
  // mutate it after this point.
  //
  // We want that assurance because Jest likes to have any filepath match
  // patterns at the end of the args it receives. Those args are going to be
  // found in our `unknownArgs`, so while we want to do some stuff in this
  // function that adds to `knownArgs` we need a guarantee that all of the
  // `unknownArgs` are _after_ all the `knownArgs` in the array we end up
  // generating the Jest configuration from.
  const args: ReadonlyArray<string> = [...knownArgs, ...config.flags.unknownArgs];

  config.logger.info(config.logger.magenta(`jest args: ${args.join(' ')}`));

  const jestArgv = yargs(args).argv as Config.Argv;
  jestArgv.config = buildJestConfig(config);

  if (typeof jestArgv.maxWorkers === 'string') {
    try {
      jestArgv.maxWorkers = parseInt(jestArgv.maxWorkers, 10);
    } catch (e) {}
  }

  if (typeof jestArgv.ci === 'string') {
    jestArgv.ci = jestArgv.ci === 'true' || jestArgv.ci === '';
  }

  for (const flag of BOOLEAN_CLI_FLAGS) {
    if (typeof jestArgv[flag] === 'string') {
      jestArgv[flag] = jestArgv[flag] === 'true';
    }
  }

  return jestArgv;
}

/**
 * Generate a Jest run configuration to be used as a part of the `argv` passed to the Jest CLI when it is invoked
 * programmatically
 * @param config the Stencil config to use while generating Jest CLI arguments
 * @returns the Jest Config to attach to the `argv` argument
 */
export function buildJestConfig(config: d.ValidatedConfig): string {
  const stencilConfigTesting = config.testing;
  const jestDefaults: Config.DefaultOptions = require('jest-config').defaults;

  const validJestConfigKeys = Object.keys(jestDefaults);

  const jestConfig: d.JestConfig = {};

  Object.keys(stencilConfigTesting).forEach((key) => {
    if (validJestConfigKeys.includes(key)) {
      (jestConfig as any)[key] = (stencilConfigTesting as any)[key];
    }
  });

  jestConfig.rootDir = config.rootDir;

  if (isString(stencilConfigTesting.collectCoverage)) {
    jestConfig.collectCoverage = stencilConfigTesting.collectCoverage;
  }
  if (Array.isArray(stencilConfigTesting.collectCoverageFrom)) {
    jestConfig.collectCoverageFrom = stencilConfigTesting.collectCoverageFrom;
  }
  if (isString(stencilConfigTesting.coverageDirectory)) {
    jestConfig.coverageDirectory = stencilConfigTesting.coverageDirectory;
  }
  if (stencilConfigTesting.coverageThreshold) {
    jestConfig.coverageThreshold = stencilConfigTesting.coverageThreshold;
  }
  if (isString(stencilConfigTesting.globalSetup)) {
    jestConfig.globalSetup = stencilConfigTesting.globalSetup;
  }
  if (isString(stencilConfigTesting.globalTeardown)) {
    jestConfig.globalTeardown = stencilConfigTesting.globalTeardown;
  }
  if (isString(stencilConfigTesting.preset)) {
    jestConfig.preset = stencilConfigTesting.preset;
  }
  if (stencilConfigTesting.projects) {
    jestConfig.projects = stencilConfigTesting.projects;
  }
  if (Array.isArray(stencilConfigTesting.reporters)) {
    jestConfig.reporters = stencilConfigTesting.reporters;
  }
  if (isString(stencilConfigTesting.testResultsProcessor)) {
    jestConfig.testResultsProcessor = stencilConfigTesting.testResultsProcessor;
  }
  if (stencilConfigTesting.transform) {
    jestConfig.transform = stencilConfigTesting.transform;
  }
  if (stencilConfigTesting.verbose) {
    jestConfig.verbose = stencilConfigTesting.verbose;
  }
  if (typeof stencilConfigTesting.bail !== 'undefined') {
    jestConfig.bail =
      typeof stencilConfigTesting.bail === 'number' ? stencilConfigTesting.bail : stencilConfigTesting.bail ? 1 : 0;
  }
  if (stencilConfigTesting.prettierPath) {
    jestConfig.prettierPath = stencilConfigTesting.prettierPath;
  }
  if (stencilConfigTesting.restoreMocks) {
    jestConfig.restoreMocks = stencilConfigTesting.restoreMocks;
  }

  jestConfig.testRunner = new Jest29Stencil().getDefaultJestRunner();

  return JSON.stringify(jestConfig);
}

export function getProjectListFromCLIArgs(config: d.ValidatedConfig, argv: Config.Argv): string[] {
  const projects = argv.projects ? argv.projects : [];

  projects.push(config.rootDir);

  return projects;
}
