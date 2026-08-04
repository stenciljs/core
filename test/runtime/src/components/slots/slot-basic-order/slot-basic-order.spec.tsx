import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-basic-order', () => {
  it('renders slotted content in correct order', async () => {
    const { root } = await render(<slot-basic-order-root />);
    await waitForExist('slot-basic-order-root.hydrated');

    expect(root.querySelector('slot-basic-order')).toHaveTextContent('abc');
    expect(root.querySelector('[hidden]')).toBeNull();
  });
});
