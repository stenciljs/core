import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser } from '@wdio/globals';

import { setupIFrameTest } from '../util.js';

describe('global script', () => {
  beforeEach(() => {
    render({
      components: [],
      template: () => <global-script-test-cmp></global-script-test-cmp>,
    });
  });

  it('supports async execution', async () => {
    const cmp = await $('global-script-test-cmp');
    await cmp.waitForStable();
    const text = await cmp.$('div').getText();
    const renderedDelay = parseInt(text.slice('I am rendered after '.length));
    expect(renderedDelay).toBeGreaterThanOrEqual(1000);
  });

  /**
   * fails in WDIO because the error is seen as test error
   */
  it.skip('logs error when component with invalid runtime is loaded', async () => {
    /**
     * Fetching logs like this only works in Chromium. Once WebdriverIO v9 is released there
     * will be easier primitives to fetch logs in other browsers as well.
     */
    if (!browser.isChromium) {
      console.warn('Skipping test because it only works in Chromium');
      return;
    }

    await setupIFrameTest('/global-script/index.html');

    const expectedErrorMessage = `Can't render component <attribute-basic /> with invalid Stencil runtime!`;
    await browser.waitUntil(
      async () => {
        const logs = (await browser.getLogs('browser')) as { message: string }[];
        expect(logs.find((log) => log.message.includes(expectedErrorMessage))).toBeTruthy();
        return true;
      },
      {
        timeoutMsg: 'Expected error message not found in console logs.',
      },
    );
  });
});
