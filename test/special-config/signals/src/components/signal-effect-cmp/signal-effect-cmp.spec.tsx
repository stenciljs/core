import { render, describe, it, expect } from '@stencil/vitest';

describe('signal-effect-cmp (@Effect)', () => {
  it('runs the effect on initialization', async () => {
    const { root } = await render<HTMLSignalEffectCmpElement>(<signal-effect-cmp />);
    const log = await root.getEffectLog();
    expect(log).toEqual([0]);
  });

  it('re-runs when tracked state changes', async () => {
    const { root, waitForChanges } = await render<HTMLSignalEffectCmpElement>(
      <signal-effect-cmp />,
    );

    await root.increment();
    await waitForChanges();

    const log = await root.getEffectLog();
    expect(log).toEqual([0, 1]);
  });

  it('does not re-run for untracked state', async () => {
    const { root, waitForChanges } = await render<HTMLSignalEffectCmpElement>(
      <signal-effect-cmp />,
    );

    const before = await root.getEffectLog();
    await root.bumpOther();
    await waitForChanges();
    const after = await root.getEffectLog();

    expect(after).toHaveLength(before.length);
  });
});

describe('signal-effect-cmp (@Effect + @Prop)', () => {
  it('runs trackMultiplied on init with default multiplier', async () => {
    const { root } = await render<HTMLSignalEffectCmpElement>(<signal-effect-cmp />);
    const log = await root.getPropEffectLog();
    expect(log).toEqual([0]); // count(0) * multiplier(1)
  });

  it('re-runs when @Prop changes', async () => {
    const { root, waitForChanges } = await render<HTMLSignalEffectCmpElement>(
      <signal-effect-cmp multiplier={2} />,
    );

    root.setAttribute('multiplier', '3');
    await waitForChanges();

    const log = await root.getPropEffectLog();
    // initial run: 0*2=0, then re-run when multiplier→3: 0*3=0
    expect(log).toHaveLength(2);
    expect(log[1]).toBe(0);
  });

  it('re-runs when @State changes, using current @Prop value', async () => {
    const { root, waitForChanges } = await render<HTMLSignalEffectCmpElement>(
      <signal-effect-cmp multiplier={5} />,
    );

    await root.increment();
    await waitForChanges();

    const log = await root.getPropEffectLog();
    expect(log).toEqual([0, 5]); // 0*5=0, then 1*5=5
  });

  it('reflects both @State and @Prop changes independently', async () => {
    const { root, waitForChanges } = await render<HTMLSignalEffectCmpElement>(
      <signal-effect-cmp multiplier={2} />,
    );

    await root.increment(); // count→1, effect: 1*2=2
    root.setAttribute('multiplier', '10');
    await waitForChanges(); // multiplier→10, effect: 1*10=10

    const log = await root.getPropEffectLog();
    expect(log).toEqual([0, 2, 10]);
  });
});
