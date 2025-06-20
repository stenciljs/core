import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser, expect } from '@wdio/globals';

describe('radio-group-blur', function () {
  beforeEach(() => {
    render({
      components: [],
      template: () => <radio-group-blur-test></radio-group-blur-test>,
    });
  });

  it('should not emit blur event when focusing radio in radio group with slot', async () => {
    // Initially both counts should be 0
    await expect($('#focus-count')).toHaveText('0');
    await expect($('#blur-count')).toHaveText('0');

    // Focus the radio button
    await $('#focus-button').click();

    // Wait a bit for any potential events to fire
    await browser.pause(100);

    // The focus count should be 1, but blur count should still be 0
    // If there's a bug, blur might also be 1 due to incorrect event handling
    await expect($('#focus-count')).toHaveText('1');
    await expect($('#blur-count')).toHaveText('0');
  });

  it('should properly handle focus and blur events separately', async () => {
    // Focus the radio
    await $('#focus-button').click();
    await browser.pause(50);

    // Should have focus but no blur
    await expect($('#focus-count')).toHaveText('1');
    await expect($('#blur-count')).toHaveText('0');

    // Now focus something else to trigger blur
    await $('#focus-button').click();
    await browser.pause(50);

    // Now we should have both focus and blur
    await expect($('#focus-count')).toHaveText('1');
    await expect($('#blur-count')).toHaveText('1');
  });
});
