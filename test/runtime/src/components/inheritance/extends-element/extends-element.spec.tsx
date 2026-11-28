import { describe, it, expect, render, h } from '@stencil/vitest';

describe('extends-element', () => {
  it('exposes an inherited @Element() to the base class', async () => {
    const { root } = await render(<extends-element />);

    expect(root.querySelector('.base-tag')).toHaveTextContent('extends-element');
    expect(root.querySelector('.label')).toHaveTextContent('base');
  });

  it('exposes an inherited @Element() to the component', async () => {
    const { root } = await render(<extends-element />);

    expect(root.querySelector('.own-tag')).toHaveTextContent('extends-element');
    expect(root.querySelector('.loaded-tag')).toHaveTextContent('extends-element');
  });
});
