import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('shadow-dom-array', () => {
  beforeEach(() => {
    render({
      template: () => <shadow-dom-array-root></shadow-dom-array-root>,
    });
  });

  it('renders children', async () => {
    await $('shadow-dom-array-root shadow-dom-array').waitForExist();

    // Test will fail on Firefox without this
    await browser.pause();

    const shadowRoot = document.body.querySelector('shadow-dom-array').shadowRoot;

    await expect(shadowRoot.children.length).toBe(1);
    await expect(shadowRoot.children[0].textContent.trim()).toBe('0');

    const button = await $('button');

    await button.click();
    await browser.pause(100);

    await expect(shadowRoot.children.length).toBe(2);
    await expect(shadowRoot.children[1].textContent.trim()).toBe('1');

    await button.click();
    await browser.pause(100);

    await expect(shadowRoot.children.length).toBe(3);
    await expect(shadowRoot.children[2].textContent.trim()).toBe('2');
  });
});
