import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('dynamic-css-variables', () => {
  beforeEach(async () => {
    render({
      template: () => <dynamic-css-variable></dynamic-css-variable>,
    });
  });

  it('should dynamically change the inline css variable', async () => {
    await expect($('header')).toHaveStyle({
      color: 'rgb(0,0,255)',
    });

    const button = $('button');
    await button.click();

    await expect($('header')).toHaveStyle({
      color: 'rgb(255,255,255)',
    });

    await button.click();

    await expect($('header')).toHaveStyle({
      color: 'rgb(0,0,255)',
    });
  });
});
