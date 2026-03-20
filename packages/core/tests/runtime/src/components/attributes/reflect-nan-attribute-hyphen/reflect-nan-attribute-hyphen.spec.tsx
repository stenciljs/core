import { render, h, describe, it, expect } from '@stencil/vitest';

describe('reflect-nan-attribute-hyphen', () => {
  it('renders the component the correct number of times', async () => {
    // The string 'NaN' will be interpreted as a number by Stencil, based on the type declaration on the prop tied to
    // the 'val-num' attribute
    const { root } = await render(<reflect-nan-attribute-hyphen val-num="NaN" />);
    expect(root.shadowRoot.querySelector('div')).toHaveTextContent('reflect-nan-attribute-hyphen Render Count: 1');
  });
});
