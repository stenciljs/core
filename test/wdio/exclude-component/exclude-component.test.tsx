import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser, expect } from '@wdio/globals';

describe('exclude-component', () => {
  before(async () => {
    render({
      components: [],
      template: () => <exclude-component-root></exclude-component-root>,
    });

    await $('exclude-component-root').waitForExist();
  });

  it('should not define the excluded component', async () => {
    // The excluded-component element should not exist in the DOM
    const excludedElement = await $('excluded-component');
    await expect(excludedElement).not.toExist();

    // But it should not be upgraded to a custom element
    // Check that customElements.get() returns undefined
    const isComponentDefined = await browser.execute(() => {
      return customElements.get('excluded-component') !== undefined;
    });

    expect(isComponentDefined).toBe(false);
  });

  it('should not render excluded component content', async () => {
    // The excluded component's content should not be rendered
    const excludedContent = await $('.excluded-content');
    await expect(excludedContent).not.toExist();
  });

  it('should not be hydrated', async () => {
    // The excluded component should not have the hydrated class
    const excludedElement = await $('exclude-component-root');
    const hasHydratedClass = await excludedElement.getAttribute('class');

    expect(hasHydratedClass).not.toContain('hydrated');
  });
});
