import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('shadow-dom-basic', () => {
  beforeEach(() => {
    render({
      template: () => <shadow-dom-basic-root></shadow-dom-basic-root>,
    });
  });

  it('render', async () => {
    await $('shadow-dom-basic-root').waitForExist();

    // Firefox fails without this
    await browser.pause();

    const elm = document.querySelector('shadow-dom-basic-root');

    expect(elm.shadowRoot).toBeDefined();

    const shadowDomBasic = elm.shadowRoot.lastElementChild;
    const lightDiv = elm.shadowRoot.lastElementChild.children[0];

    expect(lightDiv.nodeName).toBe('DIV');
    expect(lightDiv.textContent.trim()).toBe('light');

    expect(shadowDomBasic.nodeName).toBe('SHADOW-DOM-BASIC');
    const shadowDiv = shadowDomBasic.shadowRoot.lastElementChild.previousElementSibling;
    expect(shadowDiv.nodeName).toBe('DIV');
    expect(shadowDiv.textContent.trim()).toBe('shadow');

    const shadowBG = window.getComputedStyle(shadowDiv).backgroundColor;
    expect(shadowBG).toBe('rgb(0, 0, 0)');

    const lightBG = window.getComputedStyle(shadowDomBasic.lastElementChild).backgroundColor;
    expect(lightBG).toBe('rgb(255, 255, 0)');
  });
});
