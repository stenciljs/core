import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

const css = `
.esm-import-componentOnReady {
  font-weight: bold;
}
`;

describe('esm-webpack', () => {
  beforeEach(async () => {
    render({
      components: [],
      template: () => (
        <>
          <esm-import prop-val="88"></esm-import>
          <style>{css}</style>
        </>
      ),
    });

    const elm = document.querySelector('esm-import');
    elm.componentOnReady().then((readyElm) => {
      readyElm.classList.add('esm-import-componentOnReady');
    });
  });

  it('webpack', async () => {
    await $('esm-import').waitForExist();
    const host = document.querySelector('esm-import');

    const hostStyles = window.getComputedStyle(host);
    expect(hostStyles.borderBottomColor).toBe('rgb(0, 0, 255)');

    const h1 = host.shadowRoot.querySelector('h1');
    const h1Styles = window.getComputedStyle(h1);
    /**
     * <h1 /> color is given by global-css-entry.css
     * however, the component defines also a host color, which is rgb(128, 0, 128)
     */
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

    const hydratedElm = document.querySelector('esm-import.hydrated');
    expect(hydratedElm).not.toBe(null);
  });
});

function buttonClick(button: HTMLButtonElement) {
  const event = new window.CustomEvent('click', { bubbles: true, composed: true } as any);
  button.dispatchEvent(event);
}
