import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-nested-order', function () {
  beforeEach(async () => {
    render({
      template: () => (
        <slot-nested-order-parent>
          <cmp-1>1</cmp-1>
          <cmp-4 slot="italic-slot-name">4</cmp-4>
          <cmp-2>2</cmp-2>
        </slot-nested-order-parent>
      ),
    });
  });

  it('correct nested order', async () => {
    await expect($('slot-nested-order-parent')).toHaveText('123456');
    const hiddenCmp = document.querySelector('[hidden]');
    expect(hiddenCmp).toBe(null);
  });
});
