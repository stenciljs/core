import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('listen-jsx', function () {
  beforeEach(() => {
    render({
      template: () => <listen-jsx-root></listen-jsx-root>,
    });
  });

  it('button click trigger both listeners', async () => {
    await $('listen-jsx').click();
    await expect($('#result')).toHaveText('Host event');
    await expect($('#result-root')).toHaveText('Parent event');
  });
});
