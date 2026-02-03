import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser, expect } from '@wdio/globals';

describe('child-load-failure', () => {
  beforeEach(() => {
    render({
      components: [],
      template: () => <div class="root"></div>,
    });
  });

  it('parent hydrates even when child fails to load', async () => {
    const runTest = async () => {
      try {
        const root = await $('.root');
        document.querySelector('.root').innerHTML = `
          <cmp-parent></cmp-parent>
        `;

        const parent = await $('cmp-parent');
        await parent.waitForExist();

        // Wait for parent to hydrate (has hydrated class)
        await browser.waitUntil(
          async () => {
            const classes = await parent.getAttribute('class');
            return classes?.includes('hydrated');
          },
          { timeout: 5000, timeoutMsg: 'Parent did not hydrate within timeout' },
        );

        // Parent content should be visible
        const parentContent = await $('.parent-content');
        await expect(parentContent).toHaveText('Parent Loaded');
      } catch (e) {
        const parent = await $('cmp-parent');
        await parent.waitForExist();

        // Wait for parent to hydrate (has hydrated class)
        await browser.waitUntil(
          async () => {
            const classes = await parent.getAttribute('class');
            return classes?.includes('hydrated');
          },
          { timeout: 5000, timeoutMsg: 'Parent did not hydrate within timeout' },
        );

        // Parent content should be visible
        const parentContent = await $('.parent-content');
        await expect(parentContent).toHaveText('Parent Loaded');
      }
    };
    await runTest();
  });
});
