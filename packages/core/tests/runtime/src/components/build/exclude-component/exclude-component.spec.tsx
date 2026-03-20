import { render, h, describe, it, expect } from '@stencil/vitest';

describe('exclude-component', () => {
  it('should not define the excluded component', async (ctx) => {
    if (!__STENCIL_PROD__) ctx.skip(); // excludeComponents only works in production builds

    const { root } = await render(<exclude-component-root />, {waitForReady: false});
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // The excluded-component element should not exist in the DOM
    const excludedElement = root.querySelector('excluded-component');
    expect(excludedElement).toBeFalsy();

    // It should not be upgraded to a custom element
    // Check that customElements.get() returns undefined
    const isComponentDefined = customElements.get('excluded-component') !== undefined;
    expect(isComponentDefined).toBe(false);
  });

  it('should not render excluded component content', async (ctx) => {
    if (!__STENCIL_PROD__) ctx.skip(); // excludeComponents only works in production builds

    const { root } = await render(<exclude-component-root />, {waitForReady: false});
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // The excluded component's content should not be rendered
    const excludedContent = root.querySelector('.excluded-content');
    expect(excludedContent).toBeFalsy();
  });

  it('should not be hydrated', async (ctx) => {
    if (!__STENCIL_PROD__) ctx.skip(); // excludeComponents only works in production builds

    const { root } = await render(<exclude-component-root />, {waitForReady: false});
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // The root component should not have the hydrated class
    const hasHydratedClass = root.getAttribute('class');
    expect(hasHydratedClass).toBeFalsy();
  });
});
