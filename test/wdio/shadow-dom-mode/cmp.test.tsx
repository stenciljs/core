import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('shadow-dom-mode', () => {
  beforeEach(() => {
    render({
      template: () => (
        <>
          <shadow-dom-mode id="blue" colormode="blue"></shadow-dom-mode>
          <shadow-dom-mode id="red" colormode="red"></shadow-dom-mode>
        </>
      ),
    });
  });

  it('renders', async () => {
    const blueElm = $('shadow-dom-mode[id="blue"]');
    await expect(blueElm).toHaveStyle({
      'background-color': browser.isChromium ? 'rgba(0,0,255,1)' : 'rgb(0,0,255)',
    });

    const redElm = $('shadow-dom-mode[id="red"]');
    await expect(redElm).toHaveStyle({
      'background-color': browser.isChromium ? 'rgba(255,0,0,1)' : 'rgb(255,0,0)',
    });
  });
});
