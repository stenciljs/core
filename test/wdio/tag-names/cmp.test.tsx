import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('conditional-rerender', function () {
  beforeEach(() => {
    render({
      template: () => (
        <>
          <tag-88></tag-88>
          <tag-3d-component></tag-3d-component>
        </>
      ),
    });
  });

  it('should load tags with numbers in them', async () => {
    await expect($('tag-3d-component')).toHaveText('tag-3d-component');
    await expect($('tag-88')).toHaveText('tag-88');
  });
});
