import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-nested-default-order', () => {
  it('should render the slot content after the div', async () => {
    const { root } = await render(
      <slot-nested-default-order-parent>
        <p>Hello</p>
      </slot-nested-default-order-parent>,
    );

    const childCmps = root.querySelectorAll(
      'slot-nested-default-order-parent slot-nested-default-order-child > *',
    );

    expect(childCmps).toHaveLength(2);
    expect(childCmps[0].tagName.toLowerCase()).toBe('div');
    expect(childCmps[0]).toHaveTextContent('State: true');

    expect(childCmps[1].tagName.toLowerCase()).toBe('p');
    expect(childCmps[1]).toHaveTextContent('Hello');
  });
});
