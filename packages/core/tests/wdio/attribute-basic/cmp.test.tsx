import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('attribute-basic', () => {
  before(async () => {
    render({
      template: () => <attribute-basic-root></attribute-basic-root>,
    });
  });

  it('button click rerenders', async () => {
    await $('attribute-basic.hydrated').waitForExist();
    await expect($('.single')).toHaveText('single');
    await expect($('.multiWord')).toHaveText('multiWord');
    await expect($('.customAttr')).toHaveText('my-custom-attr');
    await expect($('.htmlForLabel')).toHaveAttribute('for', 'a');
    await expect($('.getter')).toHaveText('getter');

    const button = await $('button');
    await button.click();

    await expect($('.single')).toHaveText('single-update');
    await expect($('.multiWord')).toHaveText('multiWord-update');
    await expect($('.customAttr')).toHaveText('my-custom-attr-update');
    await expect($('.getter')).toHaveText('getter-update');
  });
});
