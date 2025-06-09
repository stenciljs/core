import { toDashCase } from '@utils';

import { LogLevel } from '../../declarations';
import {
  BOOLEAN_CLI_FLAGS,
  BOOLEAN_STRING_CLI_FLAGS,
  BooleanStringCLIFlag,
  ConfigFlags,
  NUMBER_CLI_FLAGS,
  STRING_ARRAY_CLI_FLAGS,
  STRING_CLI_FLAGS,
  StringArrayCLIFlag,
} from '../config-flags';
import { Empty, parseEqualsArg, parseFlags } from '../parse-flags';

describe('parseFlags', () => {
  it('should get known and unknown args', () => {
    const args = ['serve', '--address', '127.0.0.1', '--potatoArgument', '--flimflammery', 'test.spec.ts'];

    const flags = parseFlags(args);
    expect(flags.task).toBe('serve');
    expect(flags.args[0]).toBe('--address');
    expect(flags.args[1]).toBe('127.0.0.1');
    expect(flags.args[2]).toBe('--potatoArgument');
    expect(flags.args[3]).toBe('--flimflammery');
    expect(flags.args[4]).toBe('test.spec.ts');
    expect(flags.knownArgs).toEqual(['--address', '127.0.0.1']);
    expect(flags.unknownArgs[0]).toBe('--potatoArgument');
    expect(flags.unknownArgs[1]).toBe('--flimflammery');
    expect(flags.unknownArgs[2]).toBe('test.spec.ts');
  });

  it('should parse cli for dev server', () => {
    // user command line args
    // $ npm run serve --port 4444

    // args.slice(2)
    // [ 'serve', '--address', '127.0.0.1', '--port', '4444' ]

    const args = ['serve', '--address', '127.0.0.1', '--port', '4444'];

    const flags = parseFlags(args);
    expect(flags.task).toBe('serve');
    expect(flags.address).toBe('127.0.0.1');
    expect(flags.port).toBe(4444);
    expect(flags.knownArgs).toEqual(['--address', '127.0.0.1', '--port', '4444']);
  });

  it('should parse task', () => {
    const flags = parseFlags(['build']);
    expect(flags.task).toBe('build');
  });

  it('should parse no task', () => {
    const flags = parseFlags(['--flag']);
    expect(flags.task).toBe(null);
  });

  /**
   * these comprehensive tests of all the supported boolean args serve as
   * regression tests against duplicating any of the arguments in the arrays.
   * Because of the way that the arg parsing algorithm works having a dupe
   * will result in a value like `[true, true]` being set on ConfigFlags, which
   * will cause these tests to start failing.
   */
  describe.each(BOOLEAN_CLI_FLAGS)('should parse boolean flag %s', (cliArg) => {
    it('should parse arg', () => {
      const flags = parseFlags([`--${cliArg}`]);
      expect(flags.knownArgs).toEqual([`--${cliArg}`]);
      expect(flags[cliArg]).toBe(true);
    });

    it(`should parse --no${cliArg}`, () => {
      const negativeFlag = '--no' + cliArg.charAt(0).toUpperCase() + cliArg.slice(1);
      const flags = parseFlags([negativeFlag]);
      expect(flags.knownArgs).toEqual([negativeFlag]);
      expect(flags[cliArg]).toBe(false);
    });

    it(`should override --${cliArg} with --no${cliArg}`, () => {
      const negativeFlag = '--no' + cliArg.charAt(0).toUpperCase() + cliArg.slice(1);
      const flags = parseFlags([`--${cliArg}`, negativeFlag]);
      expect(flags.knownArgs).toEqual([`--${cliArg}`, negativeFlag]);
      expect(flags[cliArg]).toBe(false);
    });

    it('should not set value if not present', () => {
      const flags = parseFlags([]);
      expect(flags.knownArgs).toEqual([]);
      expect(flags[cliArg]).toBe(undefined);
    });

    it.each([true, false])(`should set the value with --${cliArg}=%p`, (value) => {
      const flags = parseFlags([`--${cliArg}=${value}`]);
      expect(flags.knownArgs).toEqual([`--${cliArg}`, String(value)]);
      expect(flags[cliArg]).toBe(value);
    });
  });

  describe.each(STRING_CLI_FLAGS)('should parse string flag %s', (cliArg) => {
    it(`should parse "--${cliArg} value"`, () => {
      const flags = parseFlags([`--${cliArg}`, 'test-value']);
      expect(flags.knownArgs).toEqual([`--${cliArg}`, 'test-value']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toBe('test-value');
    });

    it(`should parse "--${cliArg}=value"`, () => {
      const flags = parseFlags([`--${cliArg}=path/to/file.js`]);
      expect(flags.knownArgs).toEqual([`--${cliArg}`, 'path/to/file.js']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toBe('path/to/file.js');
    });

    it(`should parse "--${toDashCase(cliArg)} value"`, () => {
      const flags = parseFlags([`--${toDashCase(cliArg)}`, 'path/to/file.js']);
      expect(flags.knownArgs).toEqual([`--${toDashCase(cliArg)}`, 'path/to/file.js']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toBe('path/to/file.js');
    });

    it(`should parse "--${toDashCase(cliArg)}=value"`, () => {
      const flags = parseFlags([`--${toDashCase(cliArg)}=path/to/file.js`]);
      expect(flags.knownArgs).toEqual([`--${toDashCase(cliArg)}`, 'path/to/file.js']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toBe('path/to/file.js');
    });
  });

  it.each(NUMBER_CLI_FLAGS)('should parse number flag %s', (cliArg) => {
    const flags = parseFlags([`--${cliArg}`, '42']);
    expect(flags.knownArgs).toEqual([`--${cliArg}`, '42']);
    expect(flags.unknownArgs).toEqual([]);
    expect(flags[cliArg]).toBe(42);
  });

  it('should override --config with second --config', () => {
    const args = ['--config', '/config-1.js', '--config', '/config-2.js'];
    const flags = parseFlags(args);
    expect(flags.config).toBe('/config-2.js');
  });

  describe.each(BOOLEAN_STRING_CLI_FLAGS)('boolean-string flag - %s', (cliArg: BooleanStringCLIFlag) => {
    it('parses a boolean-string flag as a boolean with no arg', () => {
      const args = [`--${cliArg}`];
      const flags = parseFlags(args);
      expect(flags.headless).toBe(true);
      expect(flags.knownArgs).toEqual([`--${cliArg}`]);
    });

    it(`parses a boolean-string flag as a falsy boolean with "no" arg - --no-${cliArg}`, () => {
      const args = [`--no-${cliArg}`];
      const flags = parseFlags(args);
      expect(flags.headless).toBe(false);
      expect(flags.knownArgs).toEqual([`--no-${cliArg}`]);
    });

    it(`parses a boolean-string flag as a falsy boolean with "no" arg - --no${
      cliArg.charAt(0).toUpperCase() + cliArg.slice(1)
    }`, () => {
      const negativeFlag = '--no' + cliArg.charAt(0).toUpperCase() + cliArg.slice(1);
      const flags = parseFlags([negativeFlag]);
      expect(flags.headless).toBe(false);
      expect(flags.knownArgs).toEqual([negativeFlag]);
    });

    it('parses a boolean-string flag as a string with a string arg', () => {
      const args = [`--${cliArg}`, 'shell'];
      const flags = parseFlags(args);
      expect(flags.headless).toBe('shell');
      expect(flags.knownArgs).toEqual(['--headless', 'shell']);
    });

    it('parses a boolean-string flag as a string with a string arg using equality', () => {
      const args = [`--${cliArg}=shell`];
      const flags = parseFlags(args);
      expect(flags.headless).toBe('shell');
      expect(flags.knownArgs).toEqual([`--${cliArg}`, 'shell']);
    });
  });

  describe.each<LogLevel>(['info', 'warn', 'error', 'debug'])('logLevel %s', (level) => {
    it("should parse '--logLevel %s'", () => {
      const args = ['--logLevel', level];
      const flags = parseFlags(args);
      expect(flags.logLevel).toBe(level);
    });

    it('should parse --logLevel=%s', () => {
      const args = [`--logLevel=${level}`];
      const flags = parseFlags(args);
      expect(flags.logLevel).toBe(level);
    });

    it("should parse '--log-level %s'", () => {
      const flags = parseFlags(['--log-level', level]);
      expect(flags.logLevel).toBe(level);
    });

    it('should parse --log-level=%s', () => {
      const flags = parseFlags([`--log-level=${level}`]);
      expect(flags.logLevel).toBe(level);
    });
  });

  /**
   * maxWorkers is (as of this writing) our only StringNumberCLIArg, meaning it
   * may be a string (like "50%") or a number (like 4). For this reason we have
   * some tests just for it.
   */
  describe('maxWorkers', () => {
    it.each([
      ['--maxWorkers', '4'],
      ['--maxWorkers=4'],
      ['--max-workers', '4'],
      ['--maxWorkers', '4e+0'],
      ['--maxWorkers', '40e-1'],
    ])('should parse %p, %p', (...args) => {
      const flags = parseFlags(args);
      expect(flags.maxWorkers).toBe(4);
    });

    it('should parse --maxWorkers 4', () => {
      const flags = parseFlags(['--maxWorkers', '4']);
      expect(flags.maxWorkers).toBe(4);
    });

    it('should parse --maxWorkers=4', () => {
      const flags = parseFlags(['--maxWorkers=4']);
      expect(flags.maxWorkers).toBe(4);
    });

    it('should parse --max-workers 4', () => {
      const flags = parseFlags(['--max-workers', '4']);
      expect(flags.maxWorkers).toBe(4);
    });

    it('should parse --maxWorkers=50%', function () {
      // see https://jestjs.io/docs/27.x/cli#--maxworkersnumstring
      const flags = parseFlags(['--maxWorkers=50%']);
      expect(flags.maxWorkers).toBe('50%');
    });

    it('should parse --max-workers=1', () => {
      const flags = parseFlags(['--max-workers=1']);
      expect(flags.maxWorkers).toBe(1);
    });

    it('should not parse --max-workers', () => {
      const flags = parseFlags([]);
      expect(flags.maxWorkers).toBe(undefined);
    });
  });

  describe('aliases', () => {
    describe('-p (alias for port)', () => {
      it('should parse -p=4444', () => {
        const flags = parseFlags(['-p=4444']);
        expect(flags.port).toBe(4444);
      });
      it('should parse -p 4444', () => {
        const flags = parseFlags(['-p', '4444']);
        expect(flags.port).toBe(4444);
      });
    });

    it('should parse -h (alias for help)', () => {
      const flags = parseFlags(['-h']);
      expect(flags.help).toBe(true);
    });

    it('should parse -v (alias for version)', () => {
      const flags = parseFlags(['-v']);
      expect(flags.version).toBe(true);
    });

    describe('-c alias for config', () => {
      it('should parse -c /my-config.js', () => {
        const flags = parseFlags(['-c', '/my-config.js']);
        expect(flags.config).toBe('/my-config.js');
        expect(flags.knownArgs).toEqual(['--config', '/my-config.js']);
      });

      it('should parse -c=/my-config.js', () => {
        const flags = parseFlags(['-c=/my-config.js']);
        expect(flags.config).toBe('/my-config.js');
        expect(flags.knownArgs).toEqual(['--config', '/my-config.js']);
      });
    });

    describe('Jest aliases', () => {
      it.each([
        ['w', 'maxWorkers', '4'],
        ['t', 'testNamePattern', 'testname'],
      ])('should support the string Jest alias %p for %p', (alias, fullArgument, value) => {
        const flags = parseFlags([`-${alias}`, value]);
        expect(flags.knownArgs).toEqual([`--${fullArgument}`, value]);
        expect(flags.unknownArgs).toHaveLength(0);
      });

      it.each([
        ['w', 'maxWorkers', '4'],
        ['t', 'testNamePattern', 'testname'],
      ])('should support the string Jest alias %p for %p in an AliasEqualsArg', (alias, fullArgument, value) => {
        const flags = parseFlags([`-${alias}=${value}`]);
        expect(flags.knownArgs).toEqual([`--${fullArgument}`, value]);
        expect(flags.unknownArgs).toHaveLength(0);
      });

      it.each<[string, keyof ConfigFlags]>([
        ['b', 'bail'],
        ['e', 'expand'],
        ['o', 'onlyChanged'],
        ['f', 'onlyFailures'],
        ['i', 'runInBand'],
        ['u', 'updateSnapshot'],
      ])('should support the boolean Jest alias %p for %p', (alias, fullArgument) => {
        const flags = parseFlags([`-${alias}`]);
        expect(flags.knownArgs).toEqual([`--${fullArgument}`]);
        expect(flags[fullArgument]).toBe(true);
        expect(flags.unknownArgs).toHaveLength(0);
      });
    });
  });

  it('should parse many', () => {
    const args = ['-v', '--help', '-c=./myconfig.json'];
    const flags = parseFlags(args);
    expect(flags.version).toBe(true);
    expect(flags.help).toBe(true);
    expect(flags.config).toBe('./myconfig.json');
  });

  describe('parseEqualsArg', () => {
    it.each([
      ['--fooBar=baz', '--fooBar', 'baz'],
      ['--foo-bar=4', '--foo-bar', '4'],
      ['--fooBar=twenty=3*4', '--fooBar', 'twenty=3*4'],
      ['--fooBar', '--fooBar', Empty],
      ['--foo-bar', '--foo-bar', Empty],
      ['--foo-bar=""', '--foo-bar', '""'],
    ])('should parse %s correctly', (testArg, expectedArg, expectedValue) => {
      const [arg, value] = parseEqualsArg(testArg);
      expect(arg).toBe(expectedArg);
      expect(value).toEqual(expectedValue);
    });
  });

  describe.each(STRING_ARRAY_CLI_FLAGS)('should parse string flag %s', (cliArg: StringArrayCLIFlag) => {
    it(`should parse single value: "--${cliArg} test-value"`, () => {
      const flags = parseFlags([`--${cliArg}`, 'test-value']);
      expect(flags.knownArgs).toEqual([`--${cliArg}`, 'test-value']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toEqual(['test-value']);
    });

    it(`should parse multiple values: "--${cliArg} test-value"`, () => {
      const flags = parseFlags([`--${cliArg}`, 'test-value', `--${cliArg}`, 'second-test-value']);
      expect(flags.knownArgs).toEqual([`--${cliArg}`, 'test-value', `--${cliArg}`, 'second-test-value']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toEqual(['test-value', 'second-test-value']);
    });

    it(`should parse "--${cliArg}=value"`, () => {
      const flags = parseFlags([`--${cliArg}=path/to/file.js`]);
      expect(flags.knownArgs).toEqual([`--${cliArg}`, 'path/to/file.js']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toEqual(['path/to/file.js']);
    });

    it(`should parse multiple values: "--${cliArg}=test-value"`, () => {
      const flags = parseFlags([`--${cliArg}=test-value`, `--${cliArg}=second-test-value`]);
      expect(flags.knownArgs).toEqual([`--${cliArg}`, 'test-value', `--${cliArg}`, 'second-test-value']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toEqual(['test-value', 'second-test-value']);
    });

    it(`should parse "--${toDashCase(cliArg)} value"`, () => {
      const flags = parseFlags([`--${toDashCase(cliArg)}`, 'path/to/file.js']);
      expect(flags.knownArgs).toEqual([`--${toDashCase(cliArg)}`, 'path/to/file.js']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toEqual(['path/to/file.js']);
    });

    it(`should parse multiple values: "--${toDashCase(cliArg)} test-value"`, () => {
      const flags = parseFlags([
        `--${toDashCase(cliArg)}`,
        'test-value',
        `--${toDashCase(cliArg)}`,
        'second-test-value',
      ]);
      expect(flags.knownArgs).toEqual([
        `--${toDashCase(cliArg)}`,
        'test-value',
        `--${toDashCase(cliArg)}`,
        'second-test-value',
      ]);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toEqual(['test-value', 'second-test-value']);
    });

    it(`should parse "--${toDashCase(cliArg)}=value"`, () => {
      const flags = parseFlags([`--${toDashCase(cliArg)}=path/to/file.js`]);
      expect(flags.knownArgs).toEqual([`--${toDashCase(cliArg)}`, 'path/to/file.js']);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toEqual(['path/to/file.js']);
    });

    it(`should parse multiple values: "--${toDashCase(cliArg)}=test-value"`, () => {
      const flags = parseFlags([`--${toDashCase(cliArg)}=test-value`, `--${toDashCase(cliArg)}=second-test-value`]);
      expect(flags.knownArgs).toEqual([
        `--${toDashCase(cliArg)}`,
        'test-value',
        `--${toDashCase(cliArg)}`,
        'second-test-value',
      ]);
      expect(flags.unknownArgs).toEqual([]);
      expect(flags[cliArg]).toEqual(['test-value', 'second-test-value']);
    });
  });

  describe('error reporting', () => {
    it('should throw if you pass no argument to a string flag', () => {
      expect(() => {
        parseFlags(['--cacheDirectory', '--someOtherFlag']);
      }).toThrow('when parsing CLI flag "--cacheDirectory": expected a string argument but received nothing');
    });

    it('should throw if you pass no argument to a string array flag', () => {
      expect(() => {
        parseFlags(['--reporters', '--someOtherFlag']);
      }).toThrow('when parsing CLI flag "--reporters": expected a string argument but received nothing');
    });

    it('should throw if you pass no argument to a number flag', () => {
      expect(() => {
        parseFlags(['--port', '--someOtherFlag']);
      }).toThrow('when parsing CLI flag "--port": expected a number argument but received nothing');
    });

    it('should throw if you pass a non-number argument to a number flag', () => {
      expect(() => {
        parseFlags(['--port', 'stringy']);
      }).toThrow('when parsing CLI flag "--port": expected a number but received "stringy"');
    });

    it('should throw if you pass a bad number argument to a number flag', () => {
      expect(() => {
        parseFlags(['--port=NaN']);
      }).toThrow('when parsing CLI flag "--port": expected a number but received "NaN"');
    });

    it('should throw if you pass no argument to a string/number flag', () => {
      expect(() => {
        parseFlags(['--maxWorkers']);
      }).toThrow('when parsing CLI flag "--maxWorkers": expected a string or a number but received nothing');
    });

    it('should throw if you pass an invalid log level for --logLevel', () => {
      expect(() => {
        parseFlags(['--logLevel', 'potato']);
      }).toThrow('when parsing CLI flag "--logLevel": expected to receive a valid log level but received "potato"');
    });

    it('should throw if you pass no argument to --logLevel', () => {
      expect(() => {
        parseFlags(['--logLevel']);
      }).toThrow('when parsing CLI flag "--logLevel": expected to receive a valid log level but received nothing');
    });
  });
});
