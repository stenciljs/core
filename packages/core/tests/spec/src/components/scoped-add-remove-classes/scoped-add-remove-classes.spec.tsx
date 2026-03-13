import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('scoped adding and removing of classes', () => {
  it('clicking new items, adds class and removes other item classes', async () => {
    const { waitForChanges } = await render(
      <scoped-add-remove-classes
        items={[
          { id: 1, label: 'Item 1', selected: false },
          { id: 2, label: 'Item 2', selected: true },
          { id: 3, label: 'Item 3', selected: false },
          { id: 4, label: 'Item 4', selected: false },
          { id: 5, label: 'Item 5', selected: false },
          { id: 6, label: 'Item 6', selected: false },
          { id: 7, label: 'Item 7', selected: false },
          { id: 8, label: 'Item 8', selected: false },
        ]}
        selectedItems={[2]}
      ></scoped-add-remove-classes>,
    );

    const items = document.querySelectorAll('scoped-add-remove-classes .menu-item');

    let selectedItems = document.querySelectorAll('scoped-add-remove-classes .menu-selected');
    expect(selectedItems.length).toBe(1);

    (items[0] as HTMLElement).click();
    await waitForChanges();
    selectedItems = document.querySelectorAll('scoped-add-remove-classes .menu-selected');
    expect(selectedItems.length).toBe(1);

    (items[1] as HTMLElement).click();
    await waitForChanges();
    selectedItems = document.querySelectorAll('scoped-add-remove-classes .menu-selected');
    expect(selectedItems.length).toBe(1);

    (items[7] as HTMLElement).click();
    await waitForChanges();
    selectedItems = document.querySelectorAll('scoped-add-remove-classes .menu-selected');
    expect(selectedItems.length).toBe(1);
  });
});
