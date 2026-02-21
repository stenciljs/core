import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-scoped-list', () => {
  beforeEach(() => {
    render({
      template: () => <slot-list-light-scoped-root></slot-list-light-scoped-root>,
    });
  });

  it('renders this list in correct slots', async () => {
    const button = await $('slot-list-light-scoped-root button');
    const list = await $('slot-dynamic-scoped-list');

    await expect(button).toBeExisting();
    await expect(list).toBeExisting();

    await expect(list.$$('.list-wrapper > div')).not.toBeExisting();

    await button.click();

    await expect(list.$$('.list-wrapper > div')).toBeElementsArrayOfSize(4);

    const hiddenCmp = document.querySelector('[hidden]');
    expect(hiddenCmp).toBe(null);
  });
});
