import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-scoped-list', () => {
  it('renders the list in correct slots', async () => {
    const { root, waitForChanges } = await render(<slot-list-light-scoped-root />);

    const button = root.querySelector('slot-list-light-scoped-root button');
    const list = root.querySelector('slot-dynamic-scoped-list');

    expect(button).toBeTruthy();
    expect(list).toBeTruthy();

    expect(list!.querySelectorAll('.list-wrapper > div').length).toBe(0);

    button!.click();
    await waitForChanges();

    expect(list!.querySelectorAll('.list-wrapper > div').length).toBe(4);

    expect(root.querySelector('[hidden]')).toBeNull();
  });
});
