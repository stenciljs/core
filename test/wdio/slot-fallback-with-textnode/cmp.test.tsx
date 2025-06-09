import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-fallback-with-textnode', function () {
  beforeEach(() => {
    render({
      template: () => <my-component></my-component>,
    });
  });

  it('should hide fallback content when provided slot is text node', async () => {
    await expect($('.container')).toHaveText('DEFAULT', { trim: true });
    await $('#toggle-button').click();

    await expect($('.container')).not.toHaveText('DEFAULT', { trim: true });
    await expect($('.container')).toHaveText('JD', { trim: true });
  });
});
