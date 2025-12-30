import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('event-custom', function () {
  beforeEach(() => {
    render({
      template: () => <event-custom-type></event-custom-type>,
    });
  });

  it('should dispatch an event on load', async () => {
    await expect($('#counter')).toHaveText('1');
  });

  it('should emit a complex type', async () => {
    await expect($('#lastValue')).toHaveText('{"value":"Test value"}');
  });
});
