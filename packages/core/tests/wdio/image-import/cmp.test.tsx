import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('svg attr', () => {
  beforeEach(async () => {
    render({
      template: () => <image-import></image-import>,
    });
  });

  it('adds and removes attribute', async () => {
    const img = $('img');
    await img.waitForExist();

    const src = await img.getAttribute('src');
    expect(src.startsWith('data:image/svg+xml;base64,PD94bW')).toBe(true);
  });
});
