import { render, h, describe, it, expect } from '@stencil/vitest';

describe('custom-event', () => {
  it('should fire raw custom event', async () => {
    const { root, waitForChanges } = await render(<custom-event-root />);

    const output = root.querySelector('#output')!;
    const btnNoDetail = root.querySelector('#btnNoDetail')!;
    const btnWithDetail = root.querySelector('#btnWithDetail')!;

    btnNoDetail.click();
    await waitForChanges();

    expect(output).toHaveTextContent('eventNoDetail');

    btnWithDetail.click();
    await waitForChanges();

    expect(output).toHaveTextContent('eventWithDetail 88');
  });
});
