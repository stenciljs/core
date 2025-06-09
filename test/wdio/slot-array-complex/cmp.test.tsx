import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot array complex', () => {
  beforeEach(async () => {
    render({
      template: () => <slot-array-complex-root></slot-array-complex-root>,
    });

    await $('main slot-array-complex').waitForExist();
  });

  it('renders slotted content', async () => {
    await expect($('main slot-array-complex')).toHaveChildren(3);
    const elems = $('main slot-array-complex').$$('*');
    await expect(elems[0]).toHaveText('slot - start');
    await expect(elems[1]).toHaveText('slot - default');
    await expect(elems[2]).toHaveText('slot - end');

    await expect($('[hidden]')).not.toBeExisting();
  });
});
