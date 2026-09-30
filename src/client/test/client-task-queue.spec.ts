import type { plt as pltType, win as winType } from '../client-window';

describe('client task queue', () => {
  let plt: typeof pltType;
  let win: typeof winType;
  let readTask: typeof import('../client-task-queue').readTask;
  let writeTask: typeof import('../client-task-queue').writeTask;

  beforeEach(() => {
    // each test gets an isolated module instance, since `queuePending` and
    // the queued task arrays are private, file-scoped state that would
    // otherwise leak between tests
    jest.resetModules();
    ({ plt, win } = require('../client-window'));
    ({ readTask, writeTask } = require('../client-task-queue'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('flushes a queued write task via a macrotask when the document is hidden, without ever calling rAF', async () => {
    (win as any).document = { hidden: true };
    const rafSpy = jest.spyOn(plt, 'raf').mockImplementation(() => 0);

    let called = false;
    writeTask(() => {
      called = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 16));

    expect(called).toBe(true);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('yields to the event loop between flushes when reads and writes keep queuing each other while the document is hidden', async () => {
    (win as any).document = { hidden: true };

    let rounds = 0;
    const measure = () => {
      rounds++;
      writeTask(render);
    };
    const render = () => rounds < 2 && readTask(measure);
    readTask(measure);

    // a macrotask queued now must run before the second flush
    await new Promise((resolve) => setTimeout(resolve, 16));
    expect(rounds).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 16));
    expect(rounds).toBe(2);
  });

  it('still schedules the flush via rAF when the document is visible', async () => {
    (win as any).document = { hidden: false };
    let rafCallback: FrameRequestCallback | undefined;
    const rafSpy = jest.spyOn(plt, 'raf').mockImplementation((cb: FrameRequestCallback) => {
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
