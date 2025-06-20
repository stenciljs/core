import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser, expect } from '@wdio/globals';

describe('radio-group-blur', function () {
  beforeEach(async () => {
    render({
      components: [],
      template: () => <radio-group-blur-test></radio-group-blur-test>,
    });
    await browser.pause(100);
  });

  it('should not emit blur event when focusing radio in radio group with slot', async () => {
    await expect($('#blur-count')).toHaveText('0');
    await $('ion-radio').click();
    await expect($('#blur-count')).toHaveText('0');
  });
});
