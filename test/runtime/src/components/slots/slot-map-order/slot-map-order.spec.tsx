import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-map-order', () => {
  it('renders mapped items in correct order', async () => {
    const { root } = await render(<slot-map-order-root />);

    const slotMapOrder = root.querySelector('slot-map-order')!;

    expect((slotMapOrder.children[0].children[0] as HTMLInputElement).value).toBe('a');
    expect((slotMapOrder.children[1].children[0] as HTMLInputElement).value).toBe('b');
    expect((slotMapOrder.children[2].children[0] as HTMLInputElement).value).toBe('c');

    expect(root.querySelector('[hidden]')).toBeNull();
  });
});
