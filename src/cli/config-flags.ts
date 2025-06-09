import type { LogLevel, TaskCommand } from '@stencil/core/declarations';

/**
 * All the Boolean options supported by the Stencil CLI
 */
export const BOOLEAN_CLI_FLAGS = [
  'build',
  'cache',
  'checkVersion',
  'ci',
  'compare',
  'debug',
  'dev',
  'devtools',
  'docs',
  'e2e',
  'es5',
  'esm',
  'help',
  'log',
  'open',
  'prerender',
  'prerenderExternal',
  'prod',
  'profile',
  'serviceWorker',
  'screenshot',
  'serve',
  'skipNodeCheck',
  'spec',
  'ssr',
  'stats',
  'updateScreenshot',
  'verbose',
  'version',
  'watch',

  // JEST CLI OPTIONS
  'all',
  'automock',
  'bail',
  // 'cache', Stencil already supports this argument
  'changedFilesWithAncestor',
  // 'ci', Stencil already supports this argument
  'clearCache',
  'clearMocks',
  'collectCoverage',
  'color',
  'colors',
  'coverage',
  // 'debug', Stencil already supports this argument
  'detectLeaks',
  'detectOpenHandles',
  'errorOnDeprecated',
  'expand',
  'findRelatedTests',
  'forceExit',
  'init',
  'injectGlobals',
  'json',
  'lastCommit',
  'listTests',
  'logHeapUsage',
  'noStackTrace',
  'notify',
  'onlyChanged',
  'onlyFailures',
  'passWithNoTests',
  'resetMocks',
  'resetModules',
  'restoreMocks',
  'runInBand',
  'runTestsByPath',
  'showConfig',
  'silent',
  'skipFilter',
  'testLocationInResults',
  'updateSnapshot',
  'useStderr',
  // 'verbose', Stencil already supports this argument
  // 'version', Stencil already supports this argument
  // 'watch', Stencil already supports this argument
  'watchAll',
  'watchman',
] as const;

/**
 * All the Number options supported by the Stencil CLI
 */
export const NUMBER_CLI_FLAGS = [
  'port',
  // JEST CLI ARGS
  'maxConcurrency',
  'testTimeout',
] as const;

/**
 * All the String options supported by the Stencil CLI
 */
export const STRING_CLI_FLAGS = [
  'address',
  'config',
  'docsApi',
  'docsJson',
  'emulate',
  'root',
  'screenshotConnector',

  // JEST CLI ARGS
  'cacheDirectory',
  'changedSince',
  'collectCoverageFrom',
  // 'config', Stencil already supports this argument
  'coverageDirectory',
  'coverageThreshold',
  'env',
  'filter',
  'globalSetup',
  'globalTeardown',
  'globals',
  'haste',
  'moduleNameMapper',
  'notifyMode',
  'outputFile',
  'preset',
  'prettierPath',
  'resolver',
  'rootDir',
  'runner',
  'testEnvironment',
  'testEnvironmentOptions',
  'testFailureExitCode',
  'testNamePattern',
  'testResultsProcessor',
  'testRunner',
  'testSequencer',
  'testURL',
  'timers',
  'transform',
] as const;

export const STRING_ARRAY_CLI_FLAGS = [
  'collectCoverageOnlyFrom',
  'coveragePathIgnorePatterns',
  'coverageReporters',
  'moduleDirectories',
  'moduleFileExtensions',
  'modulePathIgnorePatterns',
  'modulePaths',
  'projects',
  'reporters',
  'roots',
  'selectProjects',
  'setupFiles',
  'setupFilesAfterEnv',
  'snapshotSerializers',
  'testMatch',
  'testPathIgnorePatterns',
  'testPathPattern',
  'testRegex',
  'transformIgnorePatterns',
  'unmockedModulePathPatterns',
  'watchPathIgnorePatterns',
] as const;

/**
 * All the CLI arguments which may have string or number values
 *
 * `maxWorkers` is an argument which is used both by Stencil _and_ by Jest,
 * which means that we need to support parsing both string and number values.
 */
export const STRING_NUMBER_CLI_FLAGS = ['maxWorkers'] as const;

/**
 * All the CLI arguments which may have boolean or string values.
 */
export const BOOLEAN_STRING_CLI_FLAGS = [
  /**
   * `headless` is an argument passed through to Puppeteer (which is passed to Chrome) for end-to-end testing.
   *
   * {@see https://developer.chrome.com/blog/chrome-headless-shell/}
   */
  'headless',
] as const;

/**
 * All the LogLevel-type options supported by the Stencil CLI
 *
 * This is a bit silly since there's only one such argument atm,
 * but this approach lets us make sure that we're handling all
 * our arguments in a type-safe way.
 */
export const LOG_LEVEL_CLI_FLAGS = ['logLevel'] as const;

/**
 * A type which gives the members of a `ReadonlyArray<string>` as
 * an enum-like type which can be used for e.g. keys in a `Record`
 * (as in the `AliasMap` type below)
 */
type ArrayValuesAsUnion<T extends ReadonlyArray<string>> = T[number];

export type BooleanCLIFlag = ArrayValuesAsUnion<typeof BOOLEAN_CLI_FLAGS>;
export type StringCLIFlag = ArrayValuesAsUnion<typeof STRING_CLI_FLAGS>;
export type StringArrayCLIFlag = ArrayValuesAsUnion<typeof STRING_ARRAY_CLI_FLAGS>;
export type NumberCLIFlag = ArrayValuesAsUnion<typeof NUMBER_CLI_FLAGS>;
export type StringNumberCLIFlag = ArrayValuesAsUnion<typeof STRING_NUMBER_CLI_FLAGS>;
export type BooleanStringCLIFlag = ArrayValuesAsUnion<typeof BOOLEAN_STRING_CLI_FLAGS>;
export type LogCLIFlag = ArrayValuesAsUnion<typeof LOG_LEVEL_CLI_FLAGS>;

export type KnownCLIFlag =
  | BooleanCLIFlag
  | StringCLIFlag
  | StringArrayCLIFlag
  | NumberCLIFlag
  | StringNumberCLIFlag
  | BooleanStringCLIFlag
  | LogCLIFlag;

type AliasMap = Partial<Record<string, KnownCLIFlag>>;

/**
 * For a small subset of CLI options we support a short alias e.g. `'h'` for `'help'`
 */
export const CLI_FLAG_ALIASES: AliasMap = {
  c: 'config',
  h: 'help',
  p: 'port',
  v: 'version',

  // JEST SPECIFIC CLI FLAGS
  // these are defined in
  // https://github.com/facebook/jest/blob/4156f86/packages/jest-cli/src/args.ts
  b: 'bail',
  e: 'expand',
  f: 'onlyFailures',
  i: 'runInBand',
  o: 'onlyChanged',
  t: 'testNamePattern',
  u: 'updateSnapshot',
  w: 'maxWorkers',
};

/**
 * A regular expression which can be used to match a CLI flag for one of our
 * short aliases.
 */
export const CLI_FLAG_REGEX = new RegExp(`^-[chpvbewofitu]{1}$`);

/**
 * Given two types `K` and `T` where `K` extends `ReadonlyArray<string>`,
 * construct a type which maps the strings in `K` as keys to values of type `T`.
 *
 * Because we use types derived this way to construct an interface (`ConfigFlags`)
 * for which we want optional keys, we make all the properties optional (w/ `'?'`)
 * and possibly null.
 */
type ObjectFromKeys<K extends ReadonlyArray<string>, T> = {
  [key in K[number]]?: T | null;
};

/**
 * Type containing the possible Boolean configuration flags, to be included
 * in ConfigFlags, below
 */
type BooleanConfigFlags = ObjectFromKeys<typeof BOOLEAN_CLI_FLAGS, boolean>;

/**
 * Type containing the possible String configuration flags, to be included
 * in ConfigFlags, below
 */
type StringConfigFlags = ObjectFromKeys<typeof STRING_CLI_FLAGS, string>;

/**
 * Type containing the possible String Array configuration flags. This is
 * one of the 'constituent types' for `ConfigFlags`.
 */
type StringArrayConfigFlags = ObjectFromKeys<typeof STRING_ARRAY_CLI_FLAGS, string[]>;

/**
 * Type containing the possible numeric configuration flags, to be included
 * in ConfigFlags, below
 */
type NumberConfigFlags = ObjectFromKeys<typeof NUMBER_CLI_FLAGS, number>;

/**
 * Type containing the configuration flags which may be set to either string
 * or number values.
 */
type StringNumberConfigFlags = ObjectFromKeys<typeof STRING_NUMBER_CLI_FLAGS, string | number>;

/**
 * Type containing the configuration flags which may be set to either string
 * or boolean values.
 */
type BooleanStringConfigFlags = ObjectFromKeys<typeof BOOLEAN_STRING_CLI_FLAGS, boolean | string>;

/**
 * Type containing the possible LogLevel configuration flags, to be included
 * in ConfigFlags, below
 */
type LogLevelFlags = ObjectFromKeys<typeof LOG_LEVEL_CLI_FLAGS, LogLevel>;

/**
 * The configuration flags which can be set by the user on the command line.
 * This interface captures both known arguments (which are enumerated and then
 * parsed according to their types) and unknown arguments which the user may
 * pass at the CLI.
 *
 * Note that this interface is constructed by extending `BooleanConfigFlags`,
 * `StringConfigFlags`, etc. These types are in turn constructed from types
 * extending `ReadonlyArray<string>` which we declare in another module. This
 * allows us to record our known CLI arguments in one place, using a
 * `ReadonlyArray<string>` to get both a type-level representation of what CLI
 * options we support and a runtime list of strings which can be used to match
 * on actual flags passed by the user.
 */
export interface ConfigFlags
  extends BooleanConfigFlags,
    StringConfigFlags,
    StringArrayConfigFlags,
    NumberConfigFlags,
    StringNumberConfigFlags,
    BooleanStringConfigFlags,
    LogLevelFlags {
  task: TaskCommand | null;
  args: string[];
  knownArgs: string[];
  unknownArgs: string[];
}

/**
 * Helper function for initializing a `ConfigFlags` object. Provide any overrides
 * for default values and off you go!
 *
 * @param init an object with any overrides for default values
 * @returns a complete CLI flag object
 */
export const createConfigFlags = (init: Partial<ConfigFlags> = {}): ConfigFlags => {
  const flags: ConfigFlags = {
    task: null,
    args: [],
    knownArgs: [],
    unknownArgs: [],
    ...init,
  };

  return flags;
};
