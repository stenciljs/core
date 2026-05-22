import { render, h, describe, it, expect } from '@stencil/vitest';

describe('signal-watch-cmp (@Watch)', () => {
  it('does not fire the watcher on initial load', async () => {
    const { root } = await render<HTMLSignalWatchCmpElement>(<signal-watch-cmp />);
    const history = await root.getHistory();
    expect(history).toHaveLength(0);
  });

  it('fires the watcher with (newVal, oldVal) when value changes', async () => {
    const { root, waitForChanges } = await render<HTMLSignalWatchCmpElement>(<signal-watch-cmp />);

    await root.setValue(10);
    await waitForChanges();

    const history = await root.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual({ newVal: 10, oldVal: 0 });
  });

  it('fires multiple times and tracks oldVal correctly', async () => {
    const { root, waitForChanges } = await render<HTMLSignalWatchCmpElement>(<signal-watch-cmp />);

    await root.setValue(5);
    await root.setValue(15);
    await waitForChanges();

    const history = await root.getHistory();
    expect(history).toHaveLength(2);
    expect(history[1]).toEqual({ newVal: 15, oldVal: 5 });
  });

  it('does not fire when set to the same value', async () => {
    const { root, waitForChanges } = await render<HTMLSignalWatchCmpElement>(<signal-watch-cmp />);

    await root.setValue(0);
    await waitForChanges();
    const history = await root.getHistory();
    expect(history).toHaveLength(0);
  });
});
