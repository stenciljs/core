import { render, h, describe, it, expect } from '@stencil/vitest';

describe('signal-computed-cmp (computed())', () => {
  it('renders the initial computed value', async () => {
    const { root } = await render(<signal-computed-cmp />);
    expect(root.querySelector('.doubled')).toHaveTextContent('0');
  });

  it('updates the computed value when dependency changes', async () => {
    const { root, waitForChanges } = await render<HTMLSignalComputedCmpElement>(<signal-computed-cmp />);

    await root.setCount(5);
    await waitForChanges();
    expect(root.querySelector('.doubled')).toHaveTextContent('10');

    await root.setCount(3);
    await waitForChanges();
    expect(root.querySelector('.doubled')).toHaveTextContent('6');
  });
});
