import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

const ITEM_CLASSNAME = 'default-slot-item';

describe('slot-nested-dynamic', () => {
  it('correct order after dynamic list generation', async () => {
    const { root, waitForChanges } = await render(<slot-nested-dynamic-parent />);
    await waitForExist('slot-nested-dynamic-parent.hydrated');

    const parent = root;

    // Helper function to add items dynamically
    function addItems(count: number) {
      // Remove existing items
      for (const item of Array.from(parent.querySelectorAll(`.${ITEM_CLASSNAME}`))) {
        item.remove();
      }

      // Add new items
      for (let i = 0; i < count; i++) {
        const element = document.createElement('span');
        element.className = ITEM_CLASSNAME;
        element.textContent = 'item-' + i;
        parent.appendChild(element);
      }
    }

    // First generation
    addItems(5);
    await waitForChanges();

    let items = root.querySelectorAll(`.${ITEM_CLASSNAME}`);
    expect(items[0]).toHaveTextContent('item-0');
    expect(items[1]).toHaveTextContent('item-1');
    expect(items[2]).toHaveTextContent('item-2');

    // Second generation
    addItems(7);
    await waitForChanges();

    items = root.querySelectorAll(`.${ITEM_CLASSNAME}`);
    expect(items[0]).toHaveTextContent('item-0');
    expect(items[1]).toHaveTextContent('item-1');
    expect(items[2]).toHaveTextContent('item-2');
  });
});
