import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-shadow-list', () => {
  beforeEach(() => {
    render({
      template: () => <slot-list-light-root></slot-list-light-root>,
    });
  });

  it('renders this list in correct slots', async () => {
    const button = await $('slot-list-light-root button');
    const list = await $('slot-dynamic-shadow-list');

    await expect(button).toBeExisting();
    await expect(list).toBeExisting();

    let items = list.$$('>>>.list-wrapper > div');
    await expect(items).toBeElementsArrayOfSize(0);

    await button.click();

    items = list.$$('>>>.list-wrapper > div');
    await expect(items).toBeElementsArrayOfSize(4);

    const hiddenCmp = document.querySelector('[hidden]');
    expect(hiddenCmp).toBe(null);
  });
});
