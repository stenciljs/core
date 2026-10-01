import { render, h, describe, it, expect } from '@stencil/vitest';

describe('json-basic', () => {
  it('read json content', async () => {
    const { root } = await render(<json-basic />);
    expect(root.querySelector('#json-foo')).toHaveTextContent('bar');
  });
});
