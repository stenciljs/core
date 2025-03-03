import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('json-basic', function () {
  beforeEach(() => {
    render({
      components: [],
      template: () => <json-basic></json-basic>,
    });
  });

  it('read json content', async () => {
    await expect($('#json-foo')).toHaveText('bar');
  });
});
