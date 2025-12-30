import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('node-resolution', () => {
  beforeEach(async () => {
    render({
      template: () => <node-resolution></node-resolution>,
    });
  });

  it('should import from the right sources', async () => {
    await expect($('#module-index')).toHaveText('module/index.js');
    await expect($('#module')).toHaveText('module.js');
  });
});
