import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('build-data', () => {
  beforeEach(async () => {
    render({
      template: () => <build-data></build-data>,
    });
  });

  it('should have proper values', async () => {
    await expect($('.is-dev')).toHaveText('isDev: false');
    await expect($('.is-browser')).toHaveText('isBrowser: true');
    await expect($('.is-testing')).toHaveText('isTesting: false');
  });
});
