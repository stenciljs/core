import { readOnlyArrayHasStringMember, toCamelCase } from '@utils';

import { LOG_LEVELS, LogLevel, TaskCommand } from '../declarations';
import {
  BOOLEAN_CLI_FLAGS,
  BOOLEAN_STRING_CLI_FLAGS,
  CLI_FLAG_ALIASES,
  CLI_FLAG_REGEX,
  ConfigFlags,
  createConfigFlags,
  LOG_LEVEL_CLI_FLAGS,
  NUMBER_CLI_FLAGS,
  STRING_ARRAY_CLI_FLAGS,
  STRING_CLI_FLAGS,
  STRING_NUMBER_CLI_FLAGS,
} from './config-flags';

/**
 * Parse command line arguments into a structured `ConfigFlags` object
 *
 * @param args an array of CLI flags
 * @returns a structured ConfigFlags object
 */
export const parseFlags = (args: string[]): ConfigFlags => {
  const flags: ConfigFlags = createConfigFlags();

  // cmd line has more priority over npm scripts cmd
  flags.args = Array.isArray(args) ? args.slice() : [];
  if (flags.args.length > 0 && flags.args[0] && !flags.args[0].startsWith('-')) {
    flags.task = flags.args[0] as TaskCommand;
    // if the first argument was a "task" (like `build`, `test`, etc) then
    // we go on to parse the _rest_ of the CLI args
    parseArgs(flags, args.slice(1));
  } else {
    // we didn't find a leading flag, so we should just parse them all
    parseArgs(flags, flags.args);
  }

  if (flags.task != null) {
    const i = flags.args.indexOf(flags.task);
    if (i > -1) {
      flags.args.splice(i, 1);
    }
  }

  return flags;
};

/**
 * Parse the supported command line flags which are enumerated in the
 * `config-flags` module. Handles leading dashes on arguments, aliases that are
 * defined for a small number of arguments, and parsing values for non-boolean
 * arguments (e.g. port number for the dev server).
 *
 * This parses the following grammar:
 *
 * CLIArguments    → ""
 *                 | CLITerm ( " " CLITerm )* ;
 * CLITerm         → EqualsArg
 *                 | AliasEqualsArg
 *                 | AliasArg
 *                 | NegativeDashArg
 *                 | NegativeArg
 *                 | SimpleArg ;
 * EqualsArg       → "--" ArgName "=" CLIValue ;
 * AliasEqualsArg  → "-" AliasName "=" CLIValue ;
 * AliasArg        → "-" AliasName ( " " CLIValue )? ;
 * NegativeDashArg → "--no-" ArgName ;
 * NegativeArg     → "--no" ArgName ;
 * SimpleArg       → "--" ArgName ( " " CLIValue )? ;
 * ArgName         → /^[a-zA-Z-]+$/ ;
 * AliasName       → /^[a-z]{1}$/ ;
 * CLIValue        → '"' /^[a-zA-Z0-9]+$/ '"'
 *                 | /^[a-zA-Z0-9]+$/ ;
 *
 * There are additional constraints (not shown in the grammar for brevity's sake)
 * on the type of `CLIValue` which will be associated with a particular argument.
 * We enforce this by declaring lists of boolean, string, etc arguments and
 * checking the types of values before setting them.
 *
 * We don't need to turn the list of CLI arg tokens into any kind of
 * intermediate representation since we aren't concerned with doing anything
 * other than setting the correct values on our ConfigFlags object. So we just
 * parse the array of string arguments using a recursive-descent approach
 * (which is not very deep since our grammar is pretty simple) and make the
 * modifications we need to make to the {@link ConfigFlags} object as we go.
 *
 * @param flags a ConfigFlags object to which parsed arguments will be added
 * @param args  an array of command-line arguments to parse
 */
const parseArgs = (flags: ConfigFlags, args: string[]) => {
  const argsCopy = args.concat();
  while (argsCopy.length > 0) {
    // there are still unprocessed args to deal with
    parseCLITerm(flags, argsCopy);
  }
};

/**
 * Given an array of CLI arguments, parse it and perform a series of side
 * effects (setting values on the provided `ConfigFlags` object).
 *
 * @param flags a {@link ConfigFlags} object which is updated as we parse the CLI
 * arguments
 * @param args a list of args to work through. This function (and some functions
 * it calls) calls `Array.prototype.shift` to get the next argument to look at,
 * so this parameter will be modified.
 */
const parseCLITerm = (flags: ConfigFlags, args: string[]) => {
  // pull off the first arg from the argument array
  const arg = args.shift();

  // array is empty, we're done!
  if (arg === undefined) return;

  // capture whether this is a special case of a negated boolean or boolean-string before we start to test each case
  const isNegatedBoolean =
    !readOnlyArrayHasStringMember(BOOLEAN_CLI_FLAGS, normalizeFlagName(arg)) &&
    readOnlyArrayHasStringMember(BOOLEAN_CLI_FLAGS, normalizeNegativeFlagName(arg));
  const isNegatedBooleanOrString =
    !readOnlyArrayHasStringMember(BOOLEAN_STRING_CLI_FLAGS, normalizeFlagName(arg)) &&
    readOnlyArrayHasStringMember(BOOLEAN_STRING_CLI_FLAGS, normalizeNegativeFlagName(arg));

  // EqualsArg → "--" ArgName "=" CLIValue ;
  if (arg.startsWith('--') && arg.includes('=')) {
    // we're dealing with an EqualsArg, we have a special helper for that
    const [originalArg, value] = parseEqualsArg(arg);
    setCLIArg(flags, arg.split('=')[0], normalizeFlagName(originalArg), value);
  }

  // AliasEqualsArg  → "-" AliasName "=" CLIValue ;
  else if (arg.startsWith('-') && arg.includes('=')) {
    // we're dealing with an AliasEqualsArg, we have a special helper for that
    const [originalArg, value] = parseEqualsArg(arg);
    setCLIArg(flags, desugarRawAlias(originalArg), normalizeFlagName(originalArg), value);
  }

  // AliasArg → "-" AliasName ( " " CLIValue )? ;
  else if (CLI_FLAG_REGEX.test(arg)) {
    // this is a short alias, like `-c` for Config
    setCLIArg(flags, desugarRawAlias(arg), normalizeFlagName(arg), parseCLIValue(args));
  }

  // NegativeDashArg → "--no-" ArgName ;
  else if (arg.startsWith('--no-') && arg.length > '--no-'.length) {
    // this is a `NegativeDashArg` term, so we need to normalize the negative
    // flag name and then set an appropriate value
    const normalized = normalizeNegativeFlagName(arg);
    setCLIArg(flags, arg, normalized, '');
  }

  // NegativeArg → "--no" ArgName ;
  else if (arg.startsWith('--no') && (isNegatedBoolean || isNegatedBooleanOrString)) {
    // possibly dealing with a `NegativeArg` here. There is a little ambiguity
    // here because we have arguments that already begin with `no` like
    // `notify`, so we need to test if a normalized form of the raw argument is
    // a valid and supported boolean flag.
    setCLIArg(flags, arg, normalizeNegativeFlagName(arg), '');
  }

  // SimpleArg → "--" ArgName ( " " CLIValue )? ;
  else if (arg.startsWith('--') && arg.length > '--'.length) {
    setCLIArg(flags, arg, normalizeFlagName(arg), parseCLIValue(args));
  } else {
    // if we get here then `arg` is not an argument in our list of supported
    // arguments. This doesn't necessarily mean we want to report an error or
    // anything though! Instead, with unknown / unrecognized arguments we want
    // to stick them into the `unknownArgs` array, which is used when we pass
    // CLI args to Jest, for instance.
    flags.unknownArgs.push(arg);
  }
};

/**
 * Normalize a 'negative' flag name, just to do a little pre-processing before
 * we pass it to {@link setCLIArg}.
 *
 * @param flagName the flag name to normalize
 * @returns a normalized flag name
 */
const normalizeNegativeFlagName = (flagName: string): string => {
  const trimmed = flagName.replace(/^--no[-]?/, '');
  return normalizeFlagName(trimmed.charAt(0).toLowerCase() + trimmed.slice(1));
};

/**
 * Normalize a flag name by:
 *
 * - replacing any leading dashes (`--foo` -> `foo`)
 * - converting `dash-case` to camelCase (if necessary)
 *
 * Normalizing in this context basically means converting the various
 * supported flag spelling variants to the variant defined in our lists of
 * supported arguments (e.g. BOOLEAN_CLI_FLAGS, etc). So, for instance,
 * `--log-level` should be converted to `logLevel`.
 *
 * @param flagName the flag name to normalize
 * @returns a normalized flag name
 *
 */
const normalizeFlagName = (flagName: string): string => {
  const trimmed = flagName.replace(/^-+/, '');
  return trimmed.includes('-') ? toCamelCase(trimmed) : trimmed;
};

/**
 * Set a value on a provided {@link ConfigFlags} object, given an argument
 * name and a raw string value. This function dispatches to other functions
 * which make sure that the string value can be properly parsed into a JS
 * runtime value of the right type (e.g. number, string, etc).
 *
 * @throws if a value cannot be parsed to the right type for a given flag
 * @param flags a {@link ConfigFlags} object
 * @param rawArg the raw argument name matched by the parser
 * @param normalizedArg an argument with leading control characters (`--`,
 * `--no-`, etc) removed
 * @param value the raw value to be set onto the config flags object
 */
const setCLIArg = (flags: ConfigFlags, rawArg: string, normalizedArg: string, value: CLIValueResult) => {
  normalizedArg = desugarAlias(normalizedArg);

  // We're setting a boolean!
  if (readOnlyArrayHasStringMember(BOOLEAN_CLI_FLAGS, normalizedArg)) {
    const parsed =
      typeof value === 'string'
        ? // check if the value is `'true'`
          value === 'true'
        : // no value was supplied, default to true
          true;

    flags[normalizedArg] = parsed;
    flags.knownArgs.push(rawArg);

    if (typeof value === 'string' && value !== '') {
      flags.knownArgs.push(value);
    }
  }

  // We're setting a string!
  else if (readOnlyArrayHasStringMember(STRING_CLI_FLAGS, normalizedArg)) {
    if (typeof value === 'string') {
      flags[normalizedArg] = value;
      flags.knownArgs.push(rawArg);
      flags.knownArgs.push(value);
    } else {
      throwCLIParsingError(rawArg, 'expected a string argument but received nothing');
    }
  }

  // We're setting a string, but it's one where the user can pass multiple values,
  // like `--reporters="default" --reporters="jest-junit"`
  else if (readOnlyArrayHasStringMember(STRING_ARRAY_CLI_FLAGS, normalizedArg)) {
    if (typeof value === 'string') {
      if (!Array.isArray(flags[normalizedArg])) {
        flags[normalizedArg] = [];
      }

      const targetArray = flags[normalizedArg];
      // this is irritating, but TS doesn't know that the `!Array.isArray`
      // check above guarantees we have an array to work with here, and it
      // doesn't want to narrow the type of `flags[normalizedArg]`, so we need
      // to grab a reference to that array and then `Array.isArray` that. Bah!
      if (Array.isArray(targetArray)) {
        targetArray.push(value);
        flags.knownArgs.push(rawArg);
        flags.knownArgs.push(value);
      }
    } else {
      throwCLIParsingError(rawArg, 'expected a string argument but received nothing');
    }
  }

  // We're setting a number!
  else if (readOnlyArrayHasStringMember(NUMBER_CLI_FLAGS, normalizedArg)) {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);

      if (isNaN(parsed)) {
        throwNumberParsingError(rawArg, value);
      } else {
        flags[normalizedArg] = parsed;
        flags.knownArgs.push(rawArg);
        flags.knownArgs.push(value);
      }
    } else {
      throwCLIParsingError(rawArg, 'expected a number argument but received nothing');
    }
  }

  // We're setting a value which could be either a string _or_ a number
  else if (readOnlyArrayHasStringMember(STRING_NUMBER_CLI_FLAGS, normalizedArg)) {
    if (typeof value === 'string') {
      if (CLI_ARG_STRING_REGEX.test(value)) {
        // if it matches the regex we treat it like a string
        flags[normalizedArg] = value;
      } else {
        const parsed = Number(value);

        if (isNaN(parsed)) {
          // parsing didn't go so well, we gotta get out of here
          // this is unlikely given our regex guard above
          // but hey, this is ultimately JS so let's be safe
          throwNumberParsingError(rawArg, value);
        } else {
          flags[normalizedArg] = parsed;
        }
      }
      flags.knownArgs.push(rawArg);
      flags.knownArgs.push(value);
    } else {
      throwCLIParsingError(rawArg, 'expected a string or a number but received nothing');
    }
  }

  // We're setting a value which could be either a boolean _or_ a string
  else if (readOnlyArrayHasStringMember(BOOLEAN_STRING_CLI_FLAGS, normalizedArg)) {
    const derivedValue =
      typeof value === 'string'
        ? value
          ? value // use the supplied value if it's a non-empty string
          : false // otherwise, default to false for the empty string
        : true; // no value was supplied, default to true
    flags[normalizedArg] = derivedValue;
    flags.knownArgs.push(rawArg);
    if (typeof derivedValue === 'string' && derivedValue) {
      flags.knownArgs.push(derivedValue);
    }
  }

  // We're setting the log level, which can only be a set of specific string values
  else if (readOnlyArrayHasStringMember(LOG_LEVEL_CLI_FLAGS, normalizedArg)) {
    if (typeof value === 'string') {
      if (isLogLevel(value)) {
        flags[normalizedArg] = value;
        flags.knownArgs.push(rawArg);
        flags.knownArgs.push(value);
      } else {
        throwCLIParsingError(rawArg, `expected to receive a valid log level but received "${String(value)}"`);
      }
    } else {
      throwCLIParsingError(rawArg, 'expected to receive a valid log level but received nothing');
    }
  } else {
    // we haven't found this flag in any of our lists of arguments, so we
    // should put it in our list of unknown arguments
    flags.unknownArgs.push(rawArg);

    if (typeof value === 'string') {
      flags.unknownArgs.push(value);
    }
  }
};

/**
 * We use this regular expression to detect CLI parameters which
 * should be parsed as string values (as opposed to numbers) for
 * the argument types for which we support both a string and a
 * number value.
 *
 * The regex tests for the presence of at least one character which is
 * _not_ a digit (`\d`), a period (`\.`), or one of the characters `"e"`,
 * `"E"`, `"+"`, or `"-"` (the latter four characters are necessary to
 * support the admittedly unlikely use of scientific notation, like `"4e+0"`
 * for `4`).
 *
 * Thus we'll match a string like `"50%"`, but not a string like `"50"` or
 * `"5.0"`. If it matches a given string we conclude that the string should
 * be parsed as a string literal, rather than using `Number` to convert it
 * to a number.
 */
const CLI_ARG_STRING_REGEX = /[^\d\.Ee\+\-]+/g;

export const Empty = Symbol('Empty');

/**
 * The result of trying to parse a CLI arg. This will be a `string` if a
 * well-formed value is present, or `Empty` to indicate that nothing was matched
 * or that the input was malformed.
 */
type CLIValueResult = string | typeof Empty;

/**
 * A little helper which tries to parse a CLI value (as opposed to a flag) off
 * of the argument array.
 *
 * We support a variety of different argument formats for flags (as opposed to
 * values), but all of them start with `-`, so we can check the first character
 * to test whether the next token in our array of CLI arguments is a flag name
 * or a value.
 *
 * @param args an array of CLI args
 * @returns either a string result or an Empty sentinel
 */
const parseCLIValue = (args: string[]): CLIValueResult => {
  // it's possible the arguments array is empty, if so, return empty
  if (args[0] === undefined) {
    return Empty;
  }

  // all we're concerned with here is that it does not start with `"-"`,
  // which would indicate it should be parsed as a CLI flag and not a value.
  if (!args[0].startsWith('-')) {
    // It's not a flag, so we return the value and defer any specific parsing
    // until later on.
    const value = args.shift();
    if (typeof value === 'string') {
      return value;
    }
  }
  return Empty;
};

/**
 * Parse an 'equals' argument, which is a CLI argument-value pair in the
 * format `--foobar=12` (as opposed to a space-separated format like
 * `--foobar 12`).
 *
 * To parse this we split on the `=`, returning the first part as the argument
 * name and the second part as the value. We join the value on `"="` in case
 * there is another `"="` in the argument.
 *
 * This function is safe to call with any arg, and can therefore be used as
 * an argument 'normalizer'. If CLI argument is not an 'equals' argument then
 * the return value will be a tuple of the original argument and an empty
 * string `""` for the value.
 *
 * In code terms, if you do:
 *
 * ```ts
 * const [arg, value] = parseEqualsArg("--myArgument")
 * ```
 *
 * Then `arg` will be `"--myArgument"` and `value` will be `""`, whereas if
 * you do:
 *
 *
 * ```ts
 * const [arg, value] = parseEqualsArg("--myArgument=myValue")
 * ```
 *
 * Then `arg` will be `"--myArgument"` and `value` will be `"myValue"`.
 *
 * @param arg the arg in question
 * @returns a tuple containing the arg name and the value (if present)
 */
export const parseEqualsArg = (arg: string): [string, CLIValueResult] => {
  const [originalArg, ...splitSections] = arg.split('=');
  const value = splitSections.join('=');

  return [originalArg, value === '' ? Empty : value];
};

/**
 * Small helper for getting type-system-level assurance that a `string` can be
 * narrowed to a `LogLevel`
 *
 * @param maybeLogLevel the string to check
 * @returns whether this is a `LogLevel`
 */
const isLogLevel = (maybeLogLevel: string): maybeLogLevel is LogLevel =>
  readOnlyArrayHasStringMember(LOG_LEVELS, maybeLogLevel);

/**
 * A little helper for constructing and throwing an error message with info
 * about what went wrong
 *
 * @param flag the flag which encountered the error
 * @param message a message specific to the error which was encountered
 */
const throwCLIParsingError = (flag: string, message: string) => {
  throw new Error(`when parsing CLI flag "${flag}": ${message}`);
};

/**
 * Throw a specific error for the situation where we ran into an issue parsing
 * a number.
 *
 * @param flag the flag for which we encountered the issue
 * @param value what we were trying to parse
 */
const throwNumberParsingError = (flag: string, value: string) => {
  throwCLIParsingError(flag, `expected a number but received "${value}"`);
};

/**
 * A little helper to 'desugar' a flag alias, meaning expand it to its full
 * name. For instance, the alias `"c"` will desugar to `"config"`.
 *
 * If no expansion is found for the possible alias we just return the passed
 * string unmodified.
 *
 * @param maybeAlias a string which _could_ be an alias to a full flag name
 * @returns the full aliased flag name, if found, or the passed string if not
 */
const desugarAlias = (maybeAlias: string): string => {
  const possiblyDesugared = CLI_FLAG_ALIASES[maybeAlias];

  if (typeof possiblyDesugared === 'string') {
    return possiblyDesugared;
  }
  return maybeAlias;
};

/**
 * Desugar a 'raw' alias (with a leading dash) and return an equivalent,
 * desugared argument.
 *
 * For instance, passing `"-c` will return `"--config"`.
 *
 * The reason we'd like to do this is not so much for our own code, but so that
 * we can transform an alias like `"-u"` to `"--updateSnapshot"` in order to
 * pass it along to Jest.
 *
 * @param rawAlias a CLI flag alias as found on the command line (like `"-c"`)
 * @returns an equivalent full command (like `"--config"`)
 */
const desugarRawAlias = (rawAlias: string): string => '--' + desugarAlias(normalizeFlagName(rawAlias));
