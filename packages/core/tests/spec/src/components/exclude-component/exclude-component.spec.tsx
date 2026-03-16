import { render, h, describe, it, expect } from '@stencil/vitest';

describe('exclude-component', () => {
  it('should not define the excluded component', async (ctx) => {
    // Check build mode - skip in dev since excludeComponents only works in prod
    const { root: buildData } = await render(<build-data />);
    if (buildData.querySelector('.is-dev')?.textContent === 'isDev: true') {
      ctx.skip();
    }

    const { root } = await render(<exclude-component-root />);

    // The excluded-component element should exist in the DOM as an unknown element
    const excludedElement = root.querySelector('excluded-component');
    expect(excludedElement).toBeTruthy();

    // But it should not be upgraded to a custom element
    // Check that customElements.get() returns undefined
    const isComponentDefined = customElements.get('excluded-component') !== undefined;
    expect(isComponentDefined).toBe(false);
  });

  it('should not render excluded component content', async (ctx) => {
    // Check build mode - skip in dev since excludeComponents only works in prod
    const { root: buildData } = await render(<build-data />);
    if (buildData.querySelector('.is-dev')?.textContent === 'isDev: true') {
      ctx.skip();
    }

    const { root } = await render(<exclude-component-root />);

    // The excluded component's content should not be rendered
    const excludedContent = root.querySelector('.excluded-content');
    expect(excludedContent).toBeFalsy();
  });

  it('should render the root component correctly', async () => {
    const { root } = await render(<exclude-component-root />);

    // The root component should render its content
    expect(root.querySelector('h1')).toHaveTextContent('Exclude Component Test');
    expect(root.querySelector('p')).toHaveTextContent('The component below should not be defined:');
  });
});
