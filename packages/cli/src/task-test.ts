import type { TestingRunOptions, ValidatedConfig } from '../declarations';

/**
 * Entrypoint for any Stencil tests
 * @param config a validated Stencil configuration entity
 * @returns a void promise
 */
export const taskTest = async (config: ValidatedConfig): Promise<void> => {
  config.buildDocs = false;
  const testingRunOpts: TestingRunOptions = {
    e2e: !!config.flags.e2e,
    screenshot: !!config.flags.screenshot,
    spec: !!config.flags.spec,
    updateScreenshot: !!config.flags.updateScreenshot,
  };

  // always ensure we have jest modules installed
  const ensureModuleIds = ['@types/jest', 'jest', 'jest-cli'];

  if (testingRunOpts.e2e) {
    // if it's an e2e test, also make sure we're got
    // puppeteer modules installed and if browserExecutablePath is provided don't download Chromium use only puppeteer-core instead
    const puppeteer = config.testing.browserExecutablePath ? 'puppeteer-core' : 'puppeteer';

    ensureModuleIds.push(puppeteer);

    if (testingRunOpts.screenshot) {
      // ensure we've got pixelmatch for screenshots
      config.logger.warn(
        config.logger.yellow(
          `EXPERIMENTAL: screenshot visual diff testing is currently under heavy development and has not reached a stable status. However, any assistance testing would be appreciated.`,
        ),
      );
    }
  }

  // ensure we've got the required modules installed
  const diagnostics = await config.sys.lazyRequire?.ensure(config.rootDir, ensureModuleIds);
  if (diagnostics && diagnostics.length > 0) {
    config.logger.printDiagnostics(diagnostics);
    return config.sys.exit(1);
  }

  try {
    /**
     * We dynamically import the testing submodule here in order for Stencil's lazy module checking to work properly.
     *
     * Prior to this call, we create a collection of string-based node module names and ensure that they're installed &
     * on disk. The testing submodule includes `jest` (amongst other) testing libraries in its dependency chain. We need
     * to run the lazy module check _before_ we include `jest` et al. in our dependency chain otherwise, the lazy module
     * checking would fail to run properly (because we'd import `jest`, which wouldn't exist, before we even checked if
     * it was installed).
     */
    const { createTesting } = await import('@stencil/core/testing');
    const testing = await createTesting(config);
    const passed = await testing.run(testingRunOpts);
    await testing.destroy();

    if (!passed) {
      return config.sys.exit(1);
    }
  } catch (e) {
    config.logger.error(e);
    return config.sys.exit(1);
  }
};
