import { render, h, describe, it, expect } from '@stencil/vitest';
import { getSignal, STENCIL_SIGNALS_SYMBOL } from '@stencil/core/signals';

describe('signal-counter (@State)', () => {
  it('renders the initial count', async () => {
    const { root } = await render(<signal-counter />);
    expect(root.querySelector('.count')).toHaveTextContent('0');
  });

  it('increments the count and updates the DOM', async () => {
    const { root, waitForChanges } = await render<HTMLSignalCounterElement>(<signal-counter />);

    await root.increment();
    await waitForChanges();
    expect(root.querySelector('.count')).toHaveTextContent('1');

    await root.increment();
    await waitForChanges();
    expect(root.querySelector('.count')).toHaveTextContent('2');
  });

  it('decrements the count', async () => {
    const { root, waitForChanges } = await render<HTMLSignalCounterElement>(<signal-counter />);

    await root.increment();
    await root.decrement();
    await waitForChanges();
    expect(root.querySelector('.count')).toHaveTextContent('0');
  });

  it('resets the count', async () => {
    const { root, waitForChanges } = await render<HTMLSignalCounterElement>(<signal-counter />);

    await root.increment();
    await root.increment();
    await root.reset();
    await waitForChanges();
    expect(root.querySelector('.count')).toHaveTextContent('0');
  });

  it('does not re-render when set to the same value', async () => {
    const { root, waitForChanges } = await render<HTMLSignalCounterElement>(<signal-counter />);

    await waitForChanges();
    const before = await root.getRenderCount();

    await root.reset(); // count is already 0
    await waitForChanges();
    const after = await root.getRenderCount();

    expect(after).toBe(before);
  });
});
