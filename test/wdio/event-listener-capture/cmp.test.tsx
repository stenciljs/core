import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('event-listener-capture', function () {
  const eventListenerCaptureCmp = () => $('event-listener-capture');

  beforeEach(() => {
    render({
      template: () => <event-listener-capture></event-listener-capture>,
    });
  });

  it('should render', async () => {
    await expect(eventListenerCaptureCmp()).toBePresent();
  });

  it('should increment counter on click', async () => {
    const counter = $('#counter');
    await expect(counter).toHaveText('0');

    const p = eventListenerCaptureCmp().$('#incrementer');
    await expect(p).toBePresent();
    await p.click();
    await expect(counter).toHaveText('1');
  });
});
