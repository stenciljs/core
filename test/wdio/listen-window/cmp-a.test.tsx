import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('listen-window', () => {
  beforeEach(async () => {
    render({
      template: () => <listen-window></listen-window>,
    });
  });

  it('window should receive click events', async () => {
    await expect($('#clicked')).toHaveText('Clicked: 0');
    await $('button').click();
    await expect($('#clicked')).toHaveText('Clicked: 1');
  });
});
