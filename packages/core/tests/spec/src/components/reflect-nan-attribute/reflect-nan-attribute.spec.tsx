import { render, h, describe, it, expect } from '@stencil/vitest';

describe('reflect-nan-attribute', () => {
  it('renders the component the correct number of times', async () => {
    // The string 'NaN' will be interpreted as a number by Stencil, based on
    // the type declaration on the prop tied to the 'val' attribute
    const { root } = await render(<reflect-nan-attribute val="NaN" />);
    expect(root).toHaveTextContent('reflect-nan-attribute Render Count: 1');
  });
});
