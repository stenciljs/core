import type { E2EProcessEnv, JestEnvironmentGlobal } from '@stencil/core/internal';
import NodeEnvironment from 'jest-environment-node';

import { connectBrowser, disconnectBrowser, newBrowserPage } from '../../puppeteer/puppeteer-browser';
import { JestPuppeteerEnvironmentConstructor } from '../jest-apis';

export function createJestPuppeteerEnvironment(): JestPuppeteerEnvironmentConstructor {
  const JestEnvironment = class extends NodeEnvironment {
    browser: any;
    pages: any[];

    constructor(config: any) {
      super(config);
      // Initialize fields after super() to ensure parent's global is not overwritten
      // (required for ES2022+ target where field initializers run after super())
      this.browser = null;
      this.pages = [];
      // Debug: Verify this.global is properly set
    }

    override async setup() {
      if ((process.env as E2EProcessEnv).__STENCIL_E2E_TESTS__ === 'true') {
        const globalContext = this.global as unknown as JestEnvironmentGlobal;
        globalContext.__NEW_TEST_PAGE__ = this.newPuppeteerPage.bind(this);
        globalContext.__CLOSE_OPEN_PAGES__ = this.closeOpenPages.bind(this);
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
