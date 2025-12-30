import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('custom-event', () => {
  beforeEach(() => {
    render({
      template: () => <custom-event-root></custom-event-root>,
    });
  });

  it('should fire raw custom event', async () => {
    const output = $('#output');

    await $('#btnNoDetail').click();

    await expect(output).toHaveText('eventNoDetail');

    await $('#btnWithDetail').click();

    await expect(output).toHaveText('eventWithDetail 88');
  });
});
