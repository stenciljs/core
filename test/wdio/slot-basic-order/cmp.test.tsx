import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('slot-basic-order', function () {
  beforeEach(async () => {
    render({
      components: [],
      template: () => <slot-basic-order-root></slot-basic-order-root>,
    });
    await $('slot-basic-order-root').waitForExist();
  });

  it('render', async () => {
    await expect($('slot-basic-order-root > *')).toHaveText('abc');
    await expect($('[hidden]')).not.toBeExisting();
  });
});
