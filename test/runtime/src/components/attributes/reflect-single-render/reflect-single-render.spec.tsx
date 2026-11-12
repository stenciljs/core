import { render, h, describe, it, expect } from '@stencil/vitest';

describe('reflect-single-render', () => {
  it('renders the parent and child the correct number of times', async () => {
    const { root } = await render(<parent-with-reflect-child />);

    expect(root.shadowRoot!.querySelector('div')).toHaveTextContent('Parent Render Count: 1');

    const childCmp = root.shadowRoot!.querySelector('child-with-reflection')!;
    expect(childCmp.shadowRoot!.querySelector('div')).toHaveTextContent('Child Render Count: 1');
  });
});
