import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('input-basic', function () {
  beforeEach(() => {
    render({
      template: () => <input-basic-root value="hello"></input-basic-root>,
    });
  });

  it('should change value prop both ways', async () => {
    const input = await $('input-basic-root input');

    await expect(input).toHaveValue('hello');

    await input.setValue('bye');
    await expect(input).toHaveValue('bye');

    document.querySelector('input-basic-root').value = 'value';
    await expect(input).toHaveValue('value');
  });
});
