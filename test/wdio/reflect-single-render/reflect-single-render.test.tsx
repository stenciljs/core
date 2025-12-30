import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('reflect-single-render', () => {
  beforeEach(async () => {
    render({
      template: () => <parent-with-reflect-child></parent-with-reflect-child>,
    });
  });

  it('renders the parent and child the correct number of times', async () => {
    const parentShadowRoot = await $('parent-with-reflect-child');
    await parentShadowRoot.waitForExist();

    const childShadowRoot = parentShadowRoot.shadow$('child-with-reflection');
    await parentShadowRoot.waitForExist();

    await expect(parentShadowRoot).toHaveText(expect.stringContaining('Parent Render Count: 1'));
    await expect(childShadowRoot).toHaveText('Child Render Count: 1');
  });
});
