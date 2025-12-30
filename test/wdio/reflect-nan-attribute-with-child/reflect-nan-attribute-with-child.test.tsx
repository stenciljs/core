import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('reflect-nan-attribute-with-child', () => {
  beforeEach(() => {
    render({
      template: () => <parent-reflect-nan-attribute></parent-reflect-nan-attribute>,
    });
  });

  it('renders the parent and child the correct number of times', async () => {
    await $('parent-reflect-nan-attribute').waitForExist();

    await expect($('parent-reflect-nan-attribute').$('>>>div:first-of-type').$('div:first-of-type')).toHaveText(
      'parent-reflect-nan-attribute Render Count: 1',
    );
    await expect($('parent-reflect-nan-attribute').$('>>>child-reflect-nan-attribute')).toHaveText(
      'child-reflect-nan-attribute Render Count: 1',
    );
  });
});
