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
module.exports = function (config: Config): void {
  config.set({
    browsers: Object.keys(localLaunchers),
    colors: true,
    files: [
      // general utilities for running Stencil + Karma
      'karma-stencil-utils.ts',

      // use the application built by vite
      { pattern: 'vite-bundle-test/dist/index.html', nocache: true },
      {
        pattern: 'vite-bundle-test/dist/**/*.js',
        // don't include these files via <script> tags, or they'll be included more than once
        included: false,
        nocache: true,
      },
      'vite-bundle-test/vite-bundle.spec.ts',
    ],
    // @ts-ignore - karma's configuration options are designed not to accommodate plugins (`karmaTypescriptConfig` does
    // is therefore not considered a valid key)
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.json',
    },
    frameworks: ['jasmine', 'karma-typescript'],
    // sets the log level of karma, increasing the verbosity is useful for debugging the karma itself
    logLevel: config.LOG_INFO,
    plugins: ['karma-chrome-launcher', 'karma-jasmine', 'karma-typescript'],
    /**
     * each entry in the `proxies` object maps the value of the entry (the location on disk of 1+ file(s)) to a location
     * that karma will make the files available (the key). e.g.
     *
     * {
     *   '/assets/': `/base/vite-bundle-test/dist/assets/`,
     * }
     *
     * maps the files found at '/base/vite-bundle-test/dist/assets/', to the '/assets/' directory on the karma server
     */
    proxies: {
      '/assets/': '/base/vite-bundle-test/dist/assets/',
    },
    preprocessors: {
      '**/*.ts': 'karma-typescript',
    },
    // exit after running - set this to `false` to leave the browser open to debug karma
    singleRun: true,
    // set a URL root that makes it easy to differentiate files served by karma vs other file servers
    urlRoot: '/__karma__/',
  });
};
