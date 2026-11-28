import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-array-complex', () => {
  it('renders slotted content', async () => {
    const { root, waitForChanges } = await render(<slot-array-complex-root />);
    await waitForExist('slot-array-complex-root.hydrated');
    // Wait for componentDidLoad to toggle endSlot
    await waitForChanges();

    const slotArrayComplex = root.querySelector('main slot-array-complex');
    const children = slotArrayComplex!.querySelectorAll(':scope > *');

    expect(children).toHaveLength(3);
    expect(children[0]).toHaveTextContent('slot - start');
    expect(children[1]).toHaveTextContent('slot - default');
    expect(children[2]).toHaveTextContent('slot - end');

    // Ensure no hidden elements
    expect(root.querySelector('[hidden]')).toBeNull();
  });
});
