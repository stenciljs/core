import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

const css = `
body {
  color: yellow;
}`;

describe('esm-import', () => {
  beforeEach(() => {
    render({
      components: [],
      template: () => (
        <>
          <style>{css}</style>
          <esm-import prop-val="88"></esm-import>
        </>
      ),
    });
  });

  it('import', async () => {
    await $('esm-import').waitForExist();
    const host = document.querySelector('esm-import');

    const hostStyles = window.getComputedStyle(host);
    expect(hostStyles.borderBottomColor).toBe('rgb(0, 0, 255)');

    /**
     * text color defined by :host
     */
    const span = host.shadowRoot.querySelector('span');
    const spanStyles = window.getComputedStyle(span);
    expect(spanStyles.color).toBe('rgb(128, 0, 128)');

    /**
     * test color defined by h1 rule in global-css-entry.css
     */
    const h1 = host.shadowRoot.querySelector('h1');
    const h1Styles = window.getComputedStyle(h1);
    expect(h1Styles.color).toBe('rgb(128, 0, 0)');

    const button = host.shadowRoot.querySelector('button');

    const propVal = host.shadowRoot.querySelector('#propVal');
    expect(propVal.textContent.trim()).toBe('propVal: 88');

    const stateVal = host.shadowRoot.querySelector('#stateVal');
    expect(stateVal.textContent.trim()).toBe('stateVal: mph');

    const listenVal = host.shadowRoot.querySelector('#listenVal');
    expect(listenVal.textContent.trim()).toBe('listenVal: 0');

    buttonClick(button);

    await expect($('>>> #propVal')).toHaveText('propVal: 89');
    await expect($('>>> #listenVal')).toHaveText('listenVal: 1');

    buttonClick(button);

    await expect($('>>> #propVal')).toHaveText('propVal: 90');
    await expect($('>>> #listenVal')).toHaveText('listenVal: 2');

    const isReady = host.shadowRoot.querySelector('#isReady');
    expect(isReady.textContent.trim()).toBe('componentOnReady: true');
  });
});

function buttonClick(button: HTMLButtonElement) {
  const event = new window.CustomEvent('click', { bubbles: true, composed: true } as any);
  button.dispatchEvent(event);
}
