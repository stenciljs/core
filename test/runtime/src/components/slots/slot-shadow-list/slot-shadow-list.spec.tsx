import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-shadow-list', () => {
  it('renders the list in correct slots', async () => {
    const { root, waitForChanges } = await render(<slot-list-light-root />);

    const button = root.querySelector('slot-list-light-root button');
    const list = root.querySelector('slot-dynamic-shadow-list');

    expect(button).toBeTruthy();
    expect(list).toBeTruthy();

    // divs live inside <slot> which is inside .list-wrapper
    let items = list!.shadowRoot!.querySelectorAll('.list-wrapper slot > div');
    expect(items.length).toBe(0);

    button!.click();
    await waitForChanges();

    items = list!.shadowRoot!.querySelectorAll('.list-wrapper slot > div');
    expect(items.length).toBe(4);

    expect(root.querySelector('[hidden]')).toBeNull();
  });
});
