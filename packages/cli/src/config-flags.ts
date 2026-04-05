import type { LogLevel } from '@stencil/core/compiler';

import type { TaskCommand } from './types';

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
  'esm',
  'help',
  'log',
  'open',
  'prerender',
  'prerenderExternal',
  'prod',
  'profile',
  'serviceWorker',
  'serve',
  'skipNodeCheck',
  'ssr',
  'verbose',
  'version',
  'watch',
] as const;

/**
 * All the Number options supported by the Stencil CLI
 */
export const NUMBER_CLI_FLAGS = ['port'] as const;

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
] as const;

export const STRING_ARRAY_CLI_FLAGS = [] as const;

/**
 * All the CLI arguments which may have string or number values
 *
 * `maxWorkers` controls the number of concurrent workers for Stencil builds.
 * Supports both string (e.g., "50%") and number values.
 */
export const STRING_NUMBER_CLI_FLAGS = ['maxWorkers'] as const;

/**
 * All the CLI arguments which may have boolean or string values.
 */
export const BOOLEAN_STRING_CLI_FLAGS = [
  /**
   * `stats` is an argument that can optionally accept a file path where stats should be written.
   * When used as a boolean (--stats), it defaults to 'stencil-stats.json'.
   * When used with a path (--stats dist/stats.json), it writes to that path.
   */
  'stats',
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

type BooleanCLIFlag = ArrayValuesAsUnion<typeof BOOLEAN_CLI_FLAGS>;
type StringCLIFlag = ArrayValuesAsUnion<typeof STRING_CLI_FLAGS>;
export type StringArrayCLIFlag = ArrayValuesAsUnion<typeof STRING_ARRAY_CLI_FLAGS>;
type NumberCLIFlag = ArrayValuesAsUnion<typeof NUMBER_CLI_FLAGS>;
type StringNumberCLIFlag = ArrayValuesAsUnion<typeof STRING_NUMBER_CLI_FLAGS>;
export type BooleanStringCLIFlag = ArrayValuesAsUnion<typeof BOOLEAN_STRING_CLI_FLAGS>;
type LogCLIFlag = ArrayValuesAsUnion<typeof LOG_LEVEL_CLI_FLAGS>;

type KnownCLIFlag =
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
};

/**
 * A regular expression which can be used to match a CLI flag for one of our
 * short aliases.
 */
export const CLI_FLAG_REGEX = new RegExp(`^-[chpv]{1}$`);

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
  extends
    BooleanConfigFlags,
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
