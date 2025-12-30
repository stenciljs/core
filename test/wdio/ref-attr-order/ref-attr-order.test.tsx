import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('ref-attr-order', () => {
  beforeEach(() => {
    render({
      template: () => <ref-attr-order></ref-attr-order>,
    });
  });

  it('should call the `ref` callback after handling other attrs', async () => {
    const cmp = await $('ref-attr-order');
    await cmp.waitForStable();
    await expect(cmp).toHaveText('my tabIndex: 0');
  });
});
