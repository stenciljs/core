import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { browser, expect, $ } from '@wdio/globals';

describe('auto-loader', () => {
  before(async () => {
    // Load the auto-loader script (built via auto-loader.stencil.config.ts)
    await import('../test-components-autoloader/loader.js');

    render({
      components: [],
      template: () => (
        <Fragment>
          <auto-loader-root></auto-loader-root>
          <button id="add-dynamic">Add Dynamic Component</button>
        </Fragment>
      ),
    });
  });

  describe('initial load', () => {
    it('should load component present in initial DOM', async () => {
      // Wait for root component to be defined
      await browser.waitUntil(
        async () => {
          const isDefined = await browser.execute(() => customElements.get('auto-loader-root') !== undefined);
          return isDefined;
        },
        { timeout: 5000, timeoutMsg: 'auto-loader-root was not defined' },
      );

      // Verify the component rendered correctly
      const root = await $('auto-loader-root');
      await expect(root).toBeExisting();

      // Check shadow DOM content
      const rootContent = await browser.execute(() => {
        const el = document.querySelector('auto-loader-root');
        return el?.shadowRoot?.querySelector('.root-loaded')?.textContent;
      });
      expect(rootContent).toContain('Root Component Loaded');
    });
  });

  describe('MutationObserver', () => {
    it('should load dynamically created component', async () => {
      // Click button to create dynamic element
      await browser.execute(() => {
        const btn = document.querySelector('#add-dynamic');
        btn?.addEventListener(
          'click',
          () => {
            const dynamic = document.createElement('auto-loader-dynamic');
            document.body.appendChild(dynamic);
          },
          { once: true },
        );
      });

      const btn = await $('#add-dynamic');
      await btn.click();

      // Wait for dynamic component to be defined
      await browser.waitUntil(
        async () => {
          const isDefined = await browser.execute(() => customElements.get('auto-loader-dynamic') !== undefined);
          return isDefined;
        },
        { timeout: 5000, timeoutMsg: 'auto-loader-dynamic was not defined' },
      );

      // Verify the component rendered correctly
      const dynamic = await $('auto-loader-dynamic');
      await expect(dynamic).toBeExisting();

      // Check shadow DOM content
      const dynamicContent = await browser.execute(() => {
        const el = document.querySelector('auto-loader-dynamic');
        return el?.shadowRoot?.querySelector('.dynamic-loaded')?.textContent;
      });
      expect(dynamicContent).toContain('Dynamic Component Loaded');
    });
  });

  describe('nested component auto-definition', () => {
    it('should auto-define nested child components', async () => {
      // Wait for child component to be defined (auto-defined by parent)
      await browser.waitUntil(
        async () => {
          const isDefined = await browser.execute(() => customElements.get('auto-loader-child') !== undefined);
          return isDefined;
        },
        { timeout: 5000, timeoutMsg: 'auto-loader-child was not defined' },
      );

      // Verify the child component rendered correctly inside dynamic
      const childContent = await browser.execute(() => {
        const dynamic = document.querySelector('auto-loader-dynamic');
        const child = dynamic?.shadowRoot?.querySelector('auto-loader-child');
        return child?.shadowRoot?.querySelector('.child-loaded')?.textContent;
      });
      expect(childContent).toContain('Child Component Loaded');
    });
  });
});
