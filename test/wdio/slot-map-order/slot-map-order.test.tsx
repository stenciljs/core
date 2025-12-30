import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-map-order', function () {
  beforeEach(async () => {
    render({
      template: () => <slot-map-order-root></slot-map-order-root>,
    });
  });

  it('render', async () => {
    await $('slot-map-order').waitForExist();
    const result = document.querySelector('slot-map-order');

    expect((result.children[0].children[0] as HTMLInputElement).value).toBe('a');
    expect((result.children[1].children[0] as HTMLInputElement).value).toBe('b');
    expect((result.children[2].children[0] as HTMLInputElement).value).toBe('c');

    const hiddenCmp = document.querySelector('[hidden]');
    expect(hiddenCmp).toBe(null);
  });
});
