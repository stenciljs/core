import { start } from '@stencil/core/dev-server';
import type {
  Compiler,
  CompilerBuildResults,
  CompilerWatcher,
  DevServer,
  E2EProcessEnv,
  OutputTargetWww,
  Testing,
  TestingRunOptions,
  ValidatedConfig,
} from '@stencil/core/internal';
import { hasError } from '@utils';
import type * as puppeteer from 'puppeteer';

import { getRunner, getScreenshot } from './jest/jest-stencil-connector';
import { startPuppeteerBrowser } from './puppeteer/puppeteer-browser';
import { getAppScriptUrl, getAppStyleUrl } from './testing-utils';

export const createTesting = async (config: ValidatedConfig): Promise<Testing> => {
  config = setupTestingConfig(config);

  const { createCompiler } = require('../compiler/stencil.js');
  const compiler: Compiler = await createCompiler(config);

  let devServer: DevServer | null;
  let puppeteerBrowser: puppeteer.Browser | null;

  /**
   * Initiate running spec and/or end-to-end tests with Stencil
   * @param opts running options to apply when
   * @returns true if all tests passed. Returns false if any tests failed or an error occurred during the test
   * setup/running process
   */
  const run = async (opts: TestingRunOptions = {}): Promise<boolean> => {
    let doScreenshots = false;
    let passed = false;
    let env: E2EProcessEnv;
    let compilerWatcher: CompilerWatcher | null = null;
    const msg: string[] = [];

    try {
      if (!opts.spec && !opts.e2e) {
        config.logger.error(
          `Testing requires either the --spec or --e2e command line flags, or both. For example, to run unit tests, use the command: stencil test --spec`,
        );
        return false;
      }

      // during E2E tests, we can safely assume that the current environment is a `E2EProcessEnv`
      env = process.env as E2EProcessEnv;

      if (opts.e2e) {
        msg.push('e2e');
        env.__STENCIL_E2E_TESTS__ = 'true';
      }

      if (opts.spec) {
        msg.push('spec');
        env.__STENCIL_SPEC_TESTS__ = 'true';
      }

      config.logger.info(config.logger.magenta(`testing ${msg.join(' and ')} files${config.watch ? ' (watch)' : ''}`));

      doScreenshots = !!(opts.e2e && opts.screenshot);
      if (doScreenshots) {
        env.__STENCIL_SCREENSHOT__ = 'true';
        if (config.testing.screenshotTimeout != null) {
          env.__STENCIL_SCREENSHOT_TIMEOUT_MS__ = config.testing.screenshotTimeout.toString();
        }

        if (opts.updateScreenshot) {
          config.logger.info(config.logger.magenta(`updating master screenshots`));
        } else {
          config.logger.info(config.logger.magenta(`comparing against master screenshots`));
        }
      }

      if (opts.e2e) {
        // e2e tests only
        // do a build, start a dev server
        // and spin up a puppeteer browser
        let buildTask: Promise<CompilerBuildResults> | null = null;

        (config.outputTargets as OutputTargetWww[]).forEach((outputTarget) => {
          outputTarget.empty = false;
        });

        const doBuild = !(config.flags && config.flags.build === false);
        if (doBuild && config.watch) {
          compilerWatcher = await compiler.createWatcher();
        }

        if (doBuild) {
          if (compilerWatcher) {
            const watcher = compilerWatcher;
            buildTask = new Promise((resolve) => {
              const removeListener = watcher.on('buildFinish', (buildResults) => {
                removeListener();
                resolve(buildResults);
              });
            });
            watcher.start();
          } else {
            buildTask = compiler.build();
          }
        }

        config.devServer.openBrowser = false;
        config.devServer.gzip = false;
        config.devServer.reloadStrategy = null;

        const startupResults = await Promise.all([
          start(config.devServer, config.logger),
          startPuppeteerBrowser(config),
        ]);

        devServer = startupResults[0];
        puppeteerBrowser = startupResults[1];

        if (buildTask) {
          const results = await buildTask;
          if (!results || (!config.watch && hasError(results && results.diagnostics))) {
            await destroy();
            return false;
          }
        }

        if (devServer) {
          env.__STENCIL_BROWSER_URL__ = devServer.browserUrl;
          config.logger.debug(`e2e dev server url: ${env.__STENCIL_BROWSER_URL__}`);

          env.__STENCIL_APP_SCRIPT_URL__ = getAppScriptUrl(config, devServer.browserUrl);
          config.logger.debug(`e2e app script url: ${env.__STENCIL_APP_SCRIPT_URL__}`);

          const styleUrl = getAppStyleUrl(config, devServer.browserUrl);
          if (styleUrl) {
            env.__STENCIL_APP_STYLE_URL__ = styleUrl;
            config.logger.debug(`e2e app style url: ${env.__STENCIL_APP_STYLE_URL__}`);
          }
        }
      }
    } catch (e) {
      config.logger.error(e);
      return false;
    }

    try {
      if (doScreenshots) {
        const runJestScreenshot = getScreenshot();
        passed = await runJestScreenshot(config, env);
      } else {
        const runJest = getRunner();
        passed = await runJest(config, env);
      }
      config.logger.info('');
      if (compilerWatcher) {
        await compilerWatcher.close();
      }
    } catch (e) {
      config.logger.error(e);
    }

    return passed;
  };

  /**
   * As the name suggests, this destroys things! In particular it will call the
   * `destroy` method on `config.sys` (if present) and it will also "null out"
   * `config` for GC purposes.
   */
  const destroy = async () => {
    const closingTime: Promise<any>[] = []; // you don't have to go home but you can't stay here
    if (config) {
      if (config.sys && config.sys.destroy) {
        closingTime.push(config.sys.destroy());
      }
      // we're doing this for a good reason! we want to ensure that there's not
      // a reference to the config object so it can be GC'ed
      // @ts-ignore
      config = null;
    }

    if (devServer) {
      if (devServer.close) {
        closingTime.push(devServer.close());
      }
      devServer = null;
    }

    if (puppeteerBrowser) {
      if (puppeteerBrowser.close) {
        closingTime.push(puppeteerBrowser.close());
      }
      puppeteerBrowser = null;
    }

    await Promise.all(closingTime);
  };

  return {
    destroy,
    run,
  };
};

/**
 * Create a Stencil configuration for testing purposes.
 *
 * This function accepts an internal, validated configuration entity and modifies fields on the object to be more
 * conducive to testing.
 *
 * @param validatedConfig the configuration to modify
 * @returns the modified testing configuration
 */
function setupTestingConfig(validatedConfig: ValidatedConfig): ValidatedConfig {
  validatedConfig.buildEs5 = false;
  validatedConfig.devMode = true;
  validatedConfig.minifyCss = false;
  validatedConfig.minifyJs = false;
  validatedConfig.hashFileNames = false;
  validatedConfig.validateTypes = false;
  validatedConfig._isTesting = true;
  validatedConfig.buildDist = true;

  validatedConfig.flags.serve = false;
  validatedConfig.flags.open = false;

  validatedConfig.outputTargets.forEach((o) => {
    if (o.type === 'www') {
      o.serviceWorker = null;
    }
  });

  if (validatedConfig.flags.args.includes('--watchAll')) {
    validatedConfig.watch = true;
  }

  return validatedConfig;
}
