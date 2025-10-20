import type { Config } from 'karma';

// use the instance of chromium that is downloaded as a part of stencil's puppeteer dependency
process.env.CHROME_BIN = require('puppeteer').executablePath();

const CHROME_HEADLESS = 'ChromeHeadless';

// local browsers to run the tests against
const localLaunchers = {
  [CHROME_HEADLESS]: {
    base: CHROME_HEADLESS,
    flags: [
      // run in headless mode (https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md)
      '--headless=new',
      // use --disable-gpu to avoid an error from a missing Mesa library (https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md)
      '--disable-gpu',
      // without a remote debugging port, Chrome exits immediately.
      '--remote-debugging-port=9333',
    ],
  },
};

/**
 * Export a function to configure Karma to run.
 *
 * For details on how to configure Karma, see http://karma-runner.github.io/6.3/config/configuration-file.html
 *
 * @param config the configuration object. this object will be updated/mutated with the settings necessary to run our
 * tests
 */
// Deprecated: Karma configuration removed after migrating to Jest
export {};
