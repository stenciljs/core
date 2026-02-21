import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('init-css-shim', () => {
  beforeEach(async () => {
    render({
      template: () => <init-css-root></init-css-root>,
    });
    await $('init-css-root > *').waitForExist();
  });

  it('should not replace "relavive to root" paths', async () => {
    const root = document.querySelector('#relativeToRoot');
    let imagePath = window.getComputedStyle(root).getPropertyValue('background-image');
    imagePath = imagePath.replace(/\"/g, '');
    imagePath = imagePath.replace(/\'/g, '');
    expect(imagePath).toBe(`url(${window.location.origin}/assets/favicon.ico?relativeToRoot)`);
  });

  it('should not replace "absolute" paths', async () => {
    const root = document.querySelector('#absolute');
    let imagePath = window.getComputedStyle(root).getPropertyValue('background-image');
    imagePath = imagePath.replace(/\"/g, '');
    imagePath = imagePath.replace(/\'/g, '');
    expect(imagePath).toBe(`url(https://www.google.com/favicon.ico)`);
  });
});
