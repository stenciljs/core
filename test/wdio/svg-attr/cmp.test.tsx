import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('svg attr', () => {
  beforeEach(() => {
    render({
      template: () => <svg-attr></svg-attr>,
    });
  });

  it('adds and removes attribute', async () => {
    const rect = $('rect');
    await expect(rect).not.toHaveAttribute('transform');

    await $('button').click();
    await expect(rect).toHaveAttribute('transform', 'rotate(45 27 27)');

    await $('button').click();
    await expect(rect).not.toHaveAttribute('transform');
  });
});
