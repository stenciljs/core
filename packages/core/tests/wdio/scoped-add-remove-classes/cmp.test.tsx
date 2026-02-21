import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('scoped adding and removing of classes', () => {
  before(async () => {
    render({
      template: () => (
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
        ></scoped-add-remove-classes>
      ),
    });
  });

  it('clicking new items, adds class and removes other item classes', async () => {
    await $('scoped-add-remove-classes .menu-item').waitForExist();
    const items = $$('scoped-add-remove-classes .menu-item');

    let selectedItems = await $$('scoped-add-remove-classes .menu-selected');
    await expect(selectedItems.length).toBe(1);

    await items[0].click();
    selectedItems = await $$('scoped-add-remove-classes .menu-selected');
    await expect(selectedItems.length).toBe(1);

    await items[1].click();
    selectedItems = await $$('scoped-add-remove-classes .menu-selected');
    await expect(selectedItems.length).toBe(1);

    await items[7].click();
    selectedItems = await $$('scoped-add-remove-classes .menu-selected');
    await expect(selectedItems.length).toBe(1);
  });
});
