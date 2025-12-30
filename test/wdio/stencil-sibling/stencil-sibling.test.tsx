import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('stencil-sibling', function () {
  beforeEach(() => {
    render({
      template: () => <stencil-sibling></stencil-sibling>,
    });
  });

  it('loads sibling root', async () => {
    const stencilSibling = await $('stencil-sibling');
    await stencilSibling.waitForExist();
    await expect(stencilSibling).toBeExisting();

    const siblingRoot = await stencilSibling.$('sibling-root');
    await expect(siblingRoot).toBeExisting();

    const section = await siblingRoot.$('div section');
    await expect(section).toHaveText('sibling-shadow-dom');

    const article = await siblingRoot.$('article');
    await expect(article).toHaveText('sibling-light-dom');
  });
});
