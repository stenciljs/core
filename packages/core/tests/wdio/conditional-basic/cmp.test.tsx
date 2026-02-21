import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('conditional-basic', () => {
  beforeEach(async () => {
    render({
      template: () => <conditional-basic></conditional-basic>,
    });
  });

  it('contains a button as a child', async () => {
    await expect($('button')).toBeExisting();
  });

  it('button click rerenders', async () => {
    const button = $('button');
    const results = $('div.results');

    await expect(results).toHaveText('');
    await button.click();
    await expect(results).toHaveText('Content');
  });
});
