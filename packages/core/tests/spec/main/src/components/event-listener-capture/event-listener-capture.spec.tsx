import { render, h, describe, it, expect } from '@stencil/vitest';

describe('event-listener-capture', () => {
  it('should render', async () => {
    const { root } = await render(<event-listener-capture />);
    expect(root).toBeTruthy();
  });

  it('should increment counter on click', async () => {
    const { root, waitForChanges } = await render(<event-listener-capture />);

    const counter = root.querySelector('#counter')!;
    expect(counter).toHaveTextContent('0');

    const p = root.querySelector('#incrementer')!;
    expect(p).toBeTruthy();
    p.click();
    await waitForChanges();

    expect(counter).toHaveTextContent('1');
  });
});
