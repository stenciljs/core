import { render, h, describe, it, expect, waitForStable } from '@stencil/vitest';

describe('ref-attr-order', () => {
  it('should call the `ref` callback after handling other attrs', async () => {
    const { root } = await render(<ref-attr-order />);
    await waitForStable('ref-attr-order');
    expect(root).toHaveTextContent('my tabIndex: 0');
  });
});
