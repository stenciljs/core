import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('host attribute overrides', function () {
  beforeEach(() => {
    render({
      template: () => (
        <>
          <host-attr-override class="override"></host-attr-override>
          <host-attr-override class="with-role" role="another-role"></host-attr-override>
        </>
      ),
    });
  });

  it('should merge class set in HTML with that on the Host', async () => {
    await expect($('.default.override')).toExist();
  });

  it('should override non-class attributes', async () => {
    await expect($('.with-role')).toHaveAttribute('role', 'another-role');
  });
});
