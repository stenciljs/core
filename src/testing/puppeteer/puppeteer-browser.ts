import * as d from '@stencil/core/declarations';
import type { E2EProcessEnv, ValidatedConfig } from '@stencil/core/internal';
import type * as puppeteer from 'puppeteer';
import semverMajor from 'semver/functions/major';

export async function startPuppeteerBrowser(config: ValidatedConfig) {
  if (!config.flags.e2e) {
    return null;
  }

  // during E2E tests, we can safely assume that the current environment is a `E2EProcessEnv`
  const env: E2EProcessEnv = process.env as E2EProcessEnv;
  const puppeteerDep = config.testing.browserExecutablePath ? 'puppeteer-core' : 'puppeteer';

  const puppeteerModulePath = config.sys.lazyRequire.getModulePath(config.rootDir, puppeteerDep);
  const puppeteerPackageJsonPath = config.sys.platformPath.join(puppeteerModulePath, 'package.json');
  const puppeteer = config.sys.lazyRequire.require(config.rootDir, puppeteerModulePath);
  env.__STENCIL_PUPPETEER_MODULE__ = puppeteerModulePath;

  try {
    const puppeteerManifest = config.sys.readFileSync(puppeteerPackageJsonPath, 'utf8');
    const puppeteerPkgJson: d.PackageJsonData = JSON.parse(puppeteerManifest);
    env.__STENCIL_PUPPETEER_VERSION__ = semverMajor(puppeteerPkgJson.version);
  } catch (e: unknown) {
    console.error(`An error occurred determining the version of Puppeteer installed:\n${e}`);
    env.__STENCIL_PUPPETEER_VERSION__ = undefined;
  }

  env.__STENCIL_BROWSER_WAIT_UNTIL = config.testing.browserWaitUntil;

  if (config.flags.devtools) {
    env.__STENCIL_E2E_DEVTOOLS__ = 'true';
  }

  config.logger.debug(`puppeteer: ${puppeteerModulePath}`);
  config.logger.debug(`puppeteer headless: ${config.testing.browserHeadless}`);

  if (Array.isArray(config.testing.browserArgs)) {
    config.logger.debug(`puppeteer args: ${config.testing.browserArgs.join(' ')}`);
  }

  if (typeof config.testing.browserDevtools === 'boolean') {
    config.logger.debug(`puppeteer devtools: ${config.testing.browserDevtools}`);
  }

  if (typeof config.testing.browserSlowMo === 'number') {
    config.logger.debug(`puppeteer slowMo: ${config.testing.browserSlowMo}`);
  }

  // connection options will be used regardless whether a new browser instance is created or we attach to a
  // pre-existing instance
  const connectOpts: puppeteer.ConnectOptions = {
    slowMo: config.testing.browserSlowMo,
  };

  let browser: puppeteer.Browser;
  if (config.testing.browserWSEndpoint) {
    browser = await puppeteer.connect({
      browserWSEndpoint: config.testing.browserWSEndpoint,
      ...connectOpts,
    });
  } else {
    const launchOpts: puppeteer.LaunchOptions & puppeteer.ConnectOptions = {
      args: config.testing.browserArgs,
      channel: config.testing.browserChannel,
      headless: config.testing.browserHeadless,
      devtools: config.testing.browserDevtools,
      ...connectOpts,
    };
    if (config.testing.browserExecutablePath) {
      launchOpts.executablePath = config.testing.browserExecutablePath;
    }
    browser = await puppeteer.launch({ ...launchOpts });
  }

  env.__STENCIL_BROWSER_WS_ENDPOINT__ = browser.wsEndpoint();

  config.logger.debug(`puppeteer browser wsEndpoint: ${env.__STENCIL_BROWSER_WS_ENDPOINT__}`);

  return browser;
}

export async function connectBrowser() {
  // the reason we're connecting to the browser from
  // a web socket is because jest probably has us
  // in a different thread, this is also why this
  // uses process.env for data
  //
  // during E2E tests, we can safely assume that the current environment is a `E2EProcessEnv`
  const env: E2EProcessEnv = process.env as E2EProcessEnv;

  const wsEndpoint = env.__STENCIL_BROWSER_WS_ENDPOINT__;
  if (!wsEndpoint) {
    return null;
  }

  const connectOpts: puppeteer.ConnectOptions = {
    browserWSEndpoint: wsEndpoint,
  };

  const puppeteer = require(env.__STENCIL_PUPPETEER_MODULE__);

  return await puppeteer.connect(connectOpts);
}

export async function disconnectBrowser(browser: puppeteer.Browser) {
  if (browser) {
    try {
      browser.disconnect();
    } catch (e) {}
  }
}

export function newBrowserPage(browser: puppeteer.Browser) {
  return browser.newPage();
}
