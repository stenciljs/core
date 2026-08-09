import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest';

import type { plt as pltType, win as winType } from '../client-window';

describe('client task queue', () => {
  let plt: typeof pltType;
  let win: typeof winType;
  let writeTask: typeof import('../client-task-queue').writeTask;

  beforeEach(async () => {
    // each test gets an isolated module instance, since `queuePending` and
    // the queued task arrays are private, file-scoped state that would
    // otherwise leak between tests
    vi.resetModules();
    ({ plt, win } = await import('../client-window'));
    ({ writeTask } = await import('../client-task-queue'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('flushes a queued write task via a microtask when the document is hidden, without ever calling rAF', async () => {
    (win as any).document = { hidden: true };
    const rafSpy = vi.spyOn(plt, 'raf').mockImplementation(() => 0);

    let called = false;
    writeTask(() => {
      called = true;
    });

    expect(called).toBe(false);

    // let the microtask queue drain
    await Promise.resolve();
    await Promise.resolve();

    expect(called).toBe(true);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('still schedules the flush via rAF when the document is visible', async () => {
    (win as any).document = { hidden: false };
    let rafCallback: FrameRequestCallback | undefined;
    const rafSpy = vi.spyOn(plt, 'raf').mockImplementation((cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 0;
    });

    let called = false;
    writeTask(() => {
      called = true;
    });

    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(called).toBe(false);

    rafCallback!(performance.now());

    expect(called).toBe(true);
  });
});
