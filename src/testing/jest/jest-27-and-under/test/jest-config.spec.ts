import type { Config } from '@jest/types';
import { BOOLEAN_CLI_FLAGS } from '@stencil/core/cli';
import type * as d from '@stencil/core/declarations';
import { mockValidatedConfig } from '@stencil/core/testing';
import path from 'path';

import { parseFlags } from '../../../../cli/parse-flags';
import { buildJestArgv } from '../jest-config';

describe('jest-config', () => {
  it('pass --maxWorkers=2 arg when --max-workers=2', () => {
    const args = ['test', '--ci', '--max-workers=2'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    expect(config.flags.args).toEqual(['--ci', '--max-workers=2']);
    expect(config.flags.unknownArgs).toEqual([]);

    const jestArgv = buildJestArgv(config);
    expect(jestArgv.ci).toBe(true);
    expect(jestArgv.maxWorkers).toBe(2);
  });

  // the 'help' and 'version' flags are problematic with yargs (they cause a
  // hang) and we intercept those flags and do our own thing before turning
  // over to jest anyway
  const cliFlagsToTest = BOOLEAN_CLI_FLAGS.filter((flag) => flag !== 'help' && flag !== 'version');
  describe.each(cliFlagsToTest)('should deal with flag %s correctly', (cliArg) => {
    it('converts boolean flag to boolean', () => {
      const args = ['test', `--${cliArg}`];
      const config = mockValidatedConfig();
      config.flags = parseFlags(args);
      const jestArgv = buildJestArgv(config);
      expect(jestArgv[cliArg]).toBe(true);
    });
  });

  it('marks outputFile as a Jest argument', () => {
    const args = ['test', '--ci', '--outputFile=path/to/my-file'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);
    expect(config.flags.args).toEqual(['--ci', '--outputFile=path/to/my-file']);
    expect(config.flags.unknownArgs).toEqual([]);
    const jestArgv = buildJestArgv(config);
    expect(jestArgv.outputFile).toBe('path/to/my-file');
  });

  it('pass --maxWorkers=2 arg when e2e test and --ci', () => {
    const args = ['test', '--ci', '--e2e', '--max-workers=2'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    expect(config.flags.args).toEqual(['--ci', '--e2e', '--max-workers=2']);
    expect(config.flags.unknownArgs).toEqual([]);

    const jestArgv = buildJestArgv(config);
    expect(jestArgv.ci).toBe(true);
    expect(jestArgv.maxWorkers).toBe(2);
  });

  it('passes default --maxWorkers=0 arg when e2e test and --ci', () => {
    const args = ['test', '--ci', '--e2e'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    expect(config.flags.args).toEqual(['--ci', '--e2e']);
    expect(config.flags.unknownArgs).toEqual([]);

    const jestArgv = buildJestArgv(config);
    expect(jestArgv.ci).toBe(true);
    expect(jestArgv.maxWorkers).toBe(0);
  });

  it('passed default --maxWorkers=0 arg when e2e test and --ci with filepath', () => {
    const args = ['test', '--ci', '--e2e', '--', 'my-specfile.spec.ts'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    expect(config.flags.args).toEqual(['--ci', '--e2e', '--', 'my-specfile.spec.ts']);
    expect(config.flags.unknownArgs).toEqual(['--', 'my-specfile.spec.ts']);

    const jestArgv = buildJestArgv(config);
    expect(jestArgv.ci).toBe(true);
    expect(jestArgv.maxWorkers).toBe(0);
    expect(jestArgv._).toEqual(['my-specfile.spec.ts']);
  });

  it('pass --maxWorkers=2 arg to jest', () => {
    const args = ['test', '--maxWorkers=2'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    expect(config.flags.args).toEqual(['--maxWorkers=2']);
    expect(config.flags.unknownArgs).toEqual([]);

    const jestArgv = buildJestArgv(config);
    expect(jestArgv.maxWorkers).toBe(2);
  });

  it('pass --ci arg to jest', () => {
    const args = ['test', '--ci'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    expect(config.flags.args).toEqual(['--ci']);
    expect(config.flags.unknownArgs).toEqual([]);

    const jestArgv = buildJestArgv(config);
    expect(jestArgv.ci).toBe(true);
    expect(jestArgv.maxWorkers).toBe(config.maxConcurrentWorkers);
  });

  it('sets legacy jest options', () => {
    const args = ['test'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    const jestArgv = buildJestArgv(config);

    expect(jestArgv.detectLeaks).toBe(false);
    expect(jestArgv['detect-leaks']).toBe(false);
    expect(jestArgv.detectOpenHandles).toBe(false);
    expect(jestArgv['detect-open-handles']).toBe(false);
    expect(jestArgv.detectLeaks).toBe(false);
    expect(jestArgv['detect-leaks']).toBe(false);
    expect(jestArgv.errorOnDeprecated).toBe(false);
    expect(jestArgv['error-on-deprecated']).toBe(false);
    expect(jestArgv.listTests).toBe(false);
    expect(jestArgv['list-tests']).toBe(false);
    expect(jestArgv.maxConcurrency).toBe(5);
    expect(jestArgv['max-concurrency']).toBe(5);
    expect(jestArgv.notifyMode).toBe('failure-change');
    expect(jestArgv['notify-mode']).toBe('failure-change');
    expect(jestArgv.passWithNoTests).toBe(false);
    expect(jestArgv['pass-with-no-tests']).toBe(false);
    expect(jestArgv.runTestsByPath).toBe(false);
    expect(jestArgv['run-tests-by-path']).toBe(false);
    expect(jestArgv.testLocationInResults).toBe(false);
    expect(jestArgv['test-location-in-results']).toBe(false);
  });

  it('pass test spec arg to jest', () => {
    const args = ['test', 'hello.spec.ts'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    expect(config.flags.args).toEqual(['hello.spec.ts']);
    expect(config.flags.unknownArgs).toEqual(['hello.spec.ts']);

    const jestArgv = buildJestArgv(config);
    expect(jestArgv._).toEqual(['hello.spec.ts']);
  });

  it('pass test config to jest', () => {
    const args = ['test'];
    const config = mockValidatedConfig({
      testing: {
        testMatch: ['hello.spec.ts'],
      },
    });
    config.flags = parseFlags(args);

    expect(config.flags.task).toBe('test');

    const jestArgv = buildJestArgv(config);
    // `buildJestArgv` is expected to place a `config` property on the returned `Config.Argv`, hence the use of the bang
    // operator. if one wasn't on the object, `JSON.parse` is expected to throw (failing the test).
    const parsedConfig = JSON.parse(jestArgv.config!) as d.JestConfig;
    expect(parsedConfig.testMatch).toEqual(['hello.spec.ts']);
  });

  it('set jestArgv config reporters', () => {
    const rootDir = path.resolve('/');
    const args = ['test'];
    const config = mockValidatedConfig({
      rootDir,
      testing: { reporters: ['default', ['jest-junit', { suiteName: 'jest tests' }]] },
    });
    config.flags = parseFlags(args);

    const jestArgv = buildJestArgv(config);
    // `buildJestArgv` is expected to place a `config` property on the returned `Config.Argv`, hence the use of the bang
    // operator. if one wasn't on the object, `JSON.parse` is expected to throw (failing the test).
    const parsedConfig = JSON.parse(jestArgv.config!) as d.JestConfig;
    expect(parsedConfig.reporters).toHaveLength(2);
    expect(parsedConfig.reporters[0]).toBe('default');
    expect(parsedConfig.reporters[1][0]).toBe('jest-junit');
    expect(parsedConfig.reporters[1][1].suiteName).toBe('jest tests');
  });

  it('set jestArgv config rootDir', () => {
    const rootDir = path.resolve('/');
    const args = ['test'];
    const config = mockValidatedConfig({ rootDir });
    config.flags = parseFlags(args);

    const jestArgv = buildJestArgv(config);
    // `buildJestArgv` is expected to place a `config` property on the returned `Config.Argv`, hence the use of the bang
    // operator. if one wasn't on the object, `JSON.parse` is expected to throw (failing the test).
    const parsedConfig = JSON.parse(jestArgv.config!) as d.JestConfig;
    expect(parsedConfig.rootDir).toBe(rootDir);
  });

  it('set jestArgv config collectCoverageFrom', () => {
    const rootDir = path.resolve('/');
    const args = ['test'];
    const config = mockValidatedConfig({ rootDir, testing: { collectCoverageFrom: ['**/*.+(ts|tsx)'] } });
    config.flags = parseFlags(args);

    const jestArgv = buildJestArgv(config);
    // `buildJestArgv` is expected to place a `config` property on the returned `Config.Argv`, hence the use of the bang
    // operator. if one wasn't on the object, `JSON.parse` is expected to throw (failing the test).
    const parsedConfig = JSON.parse(jestArgv.config!) as d.JestConfig;
    expect(parsedConfig.collectCoverageFrom).toHaveLength(1);
    expect(parsedConfig.collectCoverageFrom![0]).toBe('**/*.+(ts|tsx)');
  });

  it('passed flags should be respected over defaults', () => {
    const args = ['test', '--spec', '--passWithNoTests'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    expect(config.flags.args).toEqual(['--spec', '--passWithNoTests']);
    expect(config.flags.unknownArgs).toEqual([]);

    const jestArgv = buildJestArgv(config);
    expect(jestArgv.spec).toBe(true);
    expect(jestArgv.passWithNoTests).toBe(true);
  });

  it('should parse a setup with a filepath constraint', () => {
    const args = ['test', '--spec', '--json', '--', 'my-component.spec.ts'];
    const config = mockValidatedConfig();
    config.flags = parseFlags(args);

    expect(config.flags.args).toEqual(['--spec', '--json', '--', 'my-component.spec.ts']);
    expect(config.flags.unknownArgs).toEqual(['--', 'my-component.spec.ts']);

    const jestArgv = buildJestArgv(config);
    expect(jestArgv.json).toBe(true);
    // the `_` field holds any filename pattern matches
    expect(jestArgv._).toEqual(['my-component.spec.ts']);
  });

  it('should parse multiple file patterns', () => {
    const args = ['test', '--spec', '--json', '--', 'foobar/*', 'my-spec.ts'];
    const jestArgv = buildJestArgv(mockValidatedConfig({ flags: parseFlags(args) }));
    expect(jestArgv.json).toBe(true);
    // the `_` field holds any filename pattern matches
    expect(jestArgv._).toEqual(['foobar/*', 'my-spec.ts']);
  });

  describe('Jest aliases', () => {
    it('should support the string Jest alias "-w=4" for maxWorkers', () => {
      const args = ['test', '--spec', '-w=4'];
      const jestArgv = buildJestArgv(mockValidatedConfig({ flags: parseFlags(args) }));
      expect(jestArgv.maxWorkers).toBe(4);
    });

    it('should support the string Jest alias "-w 4" for maxWorkers', () => {
      const args = ['test', '--spec', '-w', '4'];
      const jestArgv = buildJestArgv(mockValidatedConfig({ flags: parseFlags(args) }));
      expect(jestArgv.maxWorkers).toBe(4);
    });

    it('should support the string Jest alias "-t" for testNamePattern', () => {
      const args = ['test', '--spec', '-t=my-test-pattern'];
      const jestArgv = buildJestArgv(mockValidatedConfig({ flags: parseFlags(args) }));
      expect(jestArgv.testNamePattern).toBe('my-test-pattern');
    });

    it('should support the string Jest alias "-t pattern" for testNamePattern', () => {
      const args = ['test', '--spec', '-t', 'my-test-pattern'];
      const jestArgv = buildJestArgv(mockValidatedConfig({ flags: parseFlags(args) }));
      expect(jestArgv.testNamePattern).toBe('my-test-pattern');
    });

    it.each<[string, keyof Config.Argv]>([
      ['b', 'bail'],
      ['e', 'expand'],
      ['o', 'onlyChanged'],
      ['f', 'onlyFailures'],
      ['i', 'runInBand'],
      ['u', 'updateSnapshot'],
    ])('should support the boolean Jest alias %p for %p', (alias, fullArgument) => {
      const args = ['test', '--spec', `-${alias}`];
      const jestArgv = buildJestArgv(mockValidatedConfig({ flags: parseFlags(args) }));
      expect(jestArgv[fullArgument]).toBe(true);
    });
  });

  it('sets the default runner', () => {
    const jestArgv = buildJestArgv(mockValidatedConfig());
    const config = JSON.parse(jestArgv.config!);
    expect(config.testRunner).toBe('jest-jasmine2');
  });
});
