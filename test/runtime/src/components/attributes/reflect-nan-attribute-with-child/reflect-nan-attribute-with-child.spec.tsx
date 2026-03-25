import { render, h, describe, it, expect } from '@stencil/vitest';

describe('reflect-nan-attribute-with-child', () => {
  it('renders the parent and child the correct number of times', async () => {
    const { root } = await render(<parent-reflect-nan-attribute />);

    const parentDiv = root.shadowRoot!.querySelector('div > div:first-of-type')!;
    expect(parentDiv).toHaveTextContent('parent-reflect-nan-attribute Render Count: 1');

    const childCmp = root.shadowRoot!.querySelector('child-reflect-nan-attribute')!;
    expect(childCmp.shadowRoot!.querySelector('div')).toHaveTextContent('child-reflect-nan-attribute Render Count: 1');
  });
});
