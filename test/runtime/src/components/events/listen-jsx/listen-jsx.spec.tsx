import { render, h, describe, it, expect } from '@stencil/vitest';

describe('listen-jsx', () => {
  it('button click trigger both listeners', async () => {
    const { root, waitForChanges } = await render(<listen-jsx-root />);

    root.querySelector('listen-jsx')!.click();
    await waitForChanges();

    expect(root.querySelector('#result')).toHaveTextContent('Host event');
    expect(root.querySelector('#result-root')).toHaveTextContent('Parent event');
  });
});
