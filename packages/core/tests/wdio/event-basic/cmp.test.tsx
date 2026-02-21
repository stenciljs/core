import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('event-basic', function () {
  beforeEach(() => {
    render({
      template: () => <event-basic></event-basic>,
    });
  });

  it('should dispatch an event on load', async () => {
    await expect($('#counter')).toHaveText('1');
  });
});
