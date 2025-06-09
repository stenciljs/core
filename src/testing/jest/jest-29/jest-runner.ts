import type { AggregatedResult } from '@jest/test-result';
import type * as d from '@stencil/core/internal';
import { default as TestRunner } from 'jest-runner';

import type { ConfigFlags } from '../../../cli/config-flags';
import { setScreenshotEmulateData } from '../../puppeteer/puppeteer-emulate';
import { JestTestRunnerConstructor } from '../jest-apis';
import { buildJestArgv, getProjectListFromCLIArgs } from './jest-config';

export async function runJest(config: d.ValidatedConfig, env: d.E2EProcessEnv) {
  let success = false;

  try {
    // set all of the emulate configs to the process.env to be read later on
    const emulateConfigs = getEmulateConfigs(config.testing, config.flags);
    env.__STENCIL_EMULATE_CONFIGS__ = JSON.stringify(emulateConfigs);
    env.__STENCIL_ENV__ = JSON.stringify(config.env);
    env.__STENCIL_TRANSPILE_PATHS__ = config.transformAliasedImportPaths ? 'true' : 'false';

    if (config.flags.ci || config.flags.e2e) {
      env.__STENCIL_DEFAULT_TIMEOUT__ = '30000';
    } else {
      env.__STENCIL_DEFAULT_TIMEOUT__ = '15000';
    }
    if (config.flags.devtools) {
      env.__STENCIL_DEFAULT_TIMEOUT__ = '300000000';
    }
    config.logger.debug(`default timeout: ${env.__STENCIL_DEFAULT_TIMEOUT__}`);

    // build up our args from our already know list of args in the config
    const jestArgv = buildJestArgv(config);
    // build up the project paths, which is basically the app's root dir
    const projects = getProjectListFromCLIArgs(config, jestArgv);

    // run the @jest/core with our data rather than letting the
    // @jest/core parse the args itself
    const { runCLI } = require('@jest/core');
    const cliResults = (await runCLI(jestArgv, projects)) as {
      results: AggregatedResult;
    };

    success = !!cliResults.results.success;
  } catch (e) {
    config.logger.error(`runJest: ${e}`);
  }

  return success;
}

/**
 * Creates a Stencil test runner
 * @returns the test runner
 */
export function createTestRunner(): JestTestRunnerConstructor {
  class StencilTestRunner extends TestRunner {
    override async runTests(tests: { context: any; path: string }[], watcher: any, options: any) {
      const env = process.env as d.E2EProcessEnv;

      // filter out only the tests the flags said we should run
      tests = tests.filter((t) => includeTestFile(t.path, env));

      if (env.__STENCIL_SCREENSHOT__ === 'true' && env.__STENCIL_EMULATE_CONFIGS__) {
        // we're doing e2e screenshots, so let's loop through
        // each of the emulate configs for each test

        // get the emulate configs from the process env
        // and parse the emulate config data
        const emulateConfigs = JSON.parse(env.__STENCIL_EMULATE_CONFIGS__) as d.EmulateConfig[];

        // loop through each emulate config to re-run the tests per config
        for (let i = 0; i < emulateConfigs.length; i++) {
          const emulateConfig = emulateConfigs[i];

          // reset the environment for each emulate config
          setScreenshotEmulateData(emulateConfig, env);

          // run the test for each emulate config
          await super.runTests(tests, watcher, options);
        }
      } else {
        // not doing e2e screenshot tests
        // so just run each test once
        await super.runTests(tests, watcher, options);
      }
    }
  }

  return StencilTestRunner;
}

export function includeTestFile(testPath: string, env: d.E2EProcessEnv) {
  testPath = testPath.toLowerCase().replace(/\\/g, '/');

  const hasE2E = testPath.includes('.e2e.') || testPath.includes('/e2e.');
  if (env.__STENCIL_E2E_TESTS__ === 'true' && hasE2E) {
    // keep this test if it's an e2e file and we should be testing e2e
    return true;
  }

  if (env.__STENCIL_SPEC_TESTS__ === 'true' && !hasE2E) {
    // keep this test if it's a spec file and we should be testing unit tests
    return true;
  }
  return false;
}

export function getEmulateConfigs(testing: d.TestingConfig, flags: ConfigFlags): d.EmulateConfig[] {
  let emulateConfigs = testing.emulate?.slice() ?? [];

  if (typeof flags.emulate === 'string') {
    const emulateFlag = flags.emulate.toLowerCase();

    emulateConfigs = emulateConfigs.filter((emulateConfig) => {
      if (typeof emulateConfig.device === 'string' && emulateConfig.device.toLowerCase() === emulateFlag) {
        return true;
      }

      if (typeof emulateConfig.userAgent === 'string' && emulateConfig.userAgent.toLowerCase().includes(emulateFlag)) {
        return true;
      }

      return false;
    });
  }

  return emulateConfigs;
}
