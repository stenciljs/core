import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('static-styles', function () {
  beforeEach(() => {
    render({
      template: () => <static-styles></static-styles>,
    });
  });

  it('applies styles from static getter', async () => {
    await $('static-styles').waitForExist();
    await expect($('h1')).toHaveStyle({
      color: browser.isChromium ? 'rgba(255,0,0,1)' : 'rgb(255,0,0)',
    });
  });
});
