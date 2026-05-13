import { render, h, describe, it, expect } from '@stencil/vitest';

describe('listen-window', () => {
  it('window should receive click events', async () => {
    const { root, waitForChanges } = await render(<listen-window />);

    expect(root.querySelector('#clicked')).toHaveTextContent('Clicked: 0');

    root.querySelector('button')!.click();
    await waitForChanges();

    expect(root.querySelector('#clicked')).toHaveTextContent('Clicked: 1');
  });
});
