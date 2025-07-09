import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('conditional-rerender', function () {
  beforeEach(() => {
    render({
      components: [],
      template: () => (
        <>
          <tag-88></tag-88>
          <tag-3d-component></tag-3d-component>
        </>
      ),
    });
  });

  it('should load tags with numbers in them', async () => {
    await expect($('tag-3d-component').$('div')).toHaveText('tag-3d-component');
    await expect($('tag-88').$('div')).toHaveText('tag-88');
  });
});
