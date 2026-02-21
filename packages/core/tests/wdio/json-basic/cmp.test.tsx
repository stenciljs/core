import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('json-basic', function () {
  beforeEach(() => {
    render({
      template: () => <json-basic></json-basic>,
    });
  });

  it('read json content', async () => {
    await expect($('#json-foo')).toHaveText('bar');
  });
});
