import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-nested-order', () => {
  it('correct nested order', async () => {
    const { root } = await render(
      <slot-nested-order-parent>
        <cmp-1>1</cmp-1>
        <cmp-4 slot='italic-slot-name'>4</cmp-4>
        <cmp-2>2</cmp-2>
      </slot-nested-order-parent>,
    );
    await waitForExist('slot-nested-order-parent.hydrated');

    expect(root.parentElement.textContent).toBe('123456');
    expect(root.querySelector('[hidden]')).toBeNull();
  });
});
