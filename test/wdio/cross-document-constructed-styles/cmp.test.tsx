import { h, render } from '@stencil/core';
import { $, browser, expect } from '@wdio/globals';

describe('cross-document-style', () => {
  before(async () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    render(<cross-document-style></cross-document-style>, iframe.contentDocument.body);
  });

  it('should render in across frames', async () => {
    await browser.switchFrame($('iframe'));
    await expect($('cross-document-style')).toHaveStyle({ color: 'rgb(255,0,0)' });
  });
});
