import type { Circus } from '@jest/types';
import type { E2EProcessEnv, JestEnvironmentGlobal } from '@stencil/core/internal';
import { TestEnvironment as NodeEnvironment } from 'jest-environment-node';

import { connectBrowser, disconnectBrowser, newBrowserPage } from '../../puppeteer/puppeteer-browser';
import { JestPuppeteerEnvironmentConstructor } from '../jest-apis';

export function createJestPuppeteerEnvironment(): JestPuppeteerEnvironmentConstructor {
  const JestEnvironment = class extends NodeEnvironment {
    // TODO(STENCIL-1023): Remove this @ts-expect-error
    // @ts-expect-error - Stencil's Jest environment adds additional properties to the Jest global, but does not extend it
    global: JestEnvironmentGlobal;
    browser: any = null;
    pages: any[] = [];
    testPath: string | null = null;

    constructor(config: any, context: any) {
      super(config, context);
      this.testPath = context.testPath;
    }

    override async setup() {
      if ((process.env as E2EProcessEnv).__STENCIL_E2E_TESTS__ === 'true') {
        this.global.__NEW_TEST_PAGE__ = this.newPuppeteerPage.bind(this);
        this.global.__CLOSE_OPEN_PAGES__ = this.closeOpenPages.bind(this);
      }
    }

    /**
     * Jest Circus hook for capturing events.
     *
     * We use this lifecycle hook to capture information about the currently running test in the event that it is a
     * Jest-Stencil screenshot test, so that we may accurately report on it.
     *
     * @param event the captured runtime event
     */
    async handleTestEvent(event: Circus.AsyncEvent): Promise<void> {
      // The 'parent' of a top-level describe block in a Jest block has one more 'parent', which is this string.
      // It is not exported by Jest, and is therefore copied here to exclude it from the fully qualified test name.
      const ROOT_DESCRIBE_BLOCK = 'ROOT_DESCRIBE_BLOCK';
      if (event.name === 'test_start') {
        const eventTest = event.test;

        /**
         * We need to build the full name of the test for screenshot tests.
         * We do this as a test name can be the same across multiple tests - e.g. `it('renders', ()  => {...});`.
         * While this does not necessarily guarantee the generated name will be unique, it matches previous Jest-Stencil
         * screenshot behavior.
         */
        let fullName = eventTest.name;
        let currentParent: Circus.DescribeBlock | undefined = eventTest.parent;
        // For each parent block (`describe('suite description', () => {...}`), grab the suite description and prepend
        // it to the running name.
        while (currentParent && currentParent.name && currentParent.name != ROOT_DESCRIBE_BLOCK) {
          fullName = `${currentParent.name} ${fullName}`;
          currentParent = currentParent.parent;
        }
        // Set the current spec for us to inspect for using the default reporter in screenshot tests.
        this.global.currentSpec = {
          // the event's test's name is analogous to the original description in earlier versions of jest
          description: eventTest.name,
          fullName,
          testPath: this.testPath,
        };
      }
    }
    async newPuppeteerPage() {
      if (!this.browser) {
        // load the browser and page on demand
        this.browser = await connectBrowser();
      }

      /**
       * if the user had open pages before, close them all when creating a new one
       */
      await this.closeOpenPages();

      const page = await newBrowserPage(this.browser);
      this.pages.push(page);
      // during E2E tests, we can safely assume that the current environment is a `E2EProcessEnv`
      const env: E2EProcessEnv = process.env as E2EProcessEnv;
      if (typeof env.__STENCIL_DEFAULT_TIMEOUT__ === 'string') {
        page.setDefaultTimeout(parseInt(env.__STENCIL_DEFAULT_TIMEOUT__, 10));
      }
      return page;
    }

    async closeOpenPages() {
      await Promise.all(this.pages.filter((page) => !page.isClosed()).map((page) => page.close()));
      this.pages.length = 0;
    }

    override async teardown() {
      await super.teardown();
      await this.closeOpenPages();
      await disconnectBrowser(this.browser);
      this.browser = null;
    }

    override getVmContext() {
      return super.getVmContext();
    }
  };

  return JestEnvironment;
}
