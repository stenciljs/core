import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

const css = `section {
    background: limegreen;
  }
  article {
    background: yellow;
  }
`;

describe('slot-dynamic-wrapper', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <style>{css}</style>
          <slot-dynamic-wrapper-root></slot-dynamic-wrapper-root>
        </>
      ),
    });
  });

  it('renders', async () => {
    await expect($('.results1 section h1')).toHaveText('parent text');

    await $('button').click();
    await $('.results1 article h1').waitForExist();

    await expect($('.results1 section h1')).not.toBeExisting();
    await expect($('.results1 article h1')).toHaveText('parent text');

    await $('button').click();

    await expect($('.results1 section h1')).toHaveText('parent text');
    await expect($('.results1 article h1')).not.toBeExisting();
    await expect($('[hidden]')).not.toBeExisting();
  });
});
