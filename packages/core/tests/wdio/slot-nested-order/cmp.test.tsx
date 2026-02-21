import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { browser, expect } from '@wdio/globals';

describe('slot-nested-order', function () {
  beforeEach(async () => {
    render({
      components: [],
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
    await browser.pause(100);
    expect(document.querySelector('stencil-stage').textContent).toBe('123456');
    const hiddenCmp = document.querySelector('[hidden]');
    expect(hiddenCmp).toBe(null);
  });
});
