import type { drainWaitingElements as TDrain } from '../hydrate-app';

describe('drainWaitingElements (#6864)', () => {
  let drainWaitingElements: typeof TDrain;

  beforeEach(async () => {
    drainWaitingElements = require('../hydrate-app').drainWaitingElements;
  });

  afterEach(async () => {
    jest.resetModules();
  });

  it('resolves immediately when the set is empty', async () => {
    const waiting = new Set();
    const start = Date.now();
    await drainWaitingElements(waiting, 500);
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('waits for elements to be removed before resolving', async () => {
    const waiting = new Set<{ id: number }>([{ id: 1 }, { id: 2 }, { id: 3 }]);

    let resolved = false;
    const drained = drainWaitingElements(waiting, 1000).then(() => {
      resolved = true;
    });

    // After 80ms: remove one element.
    setTimeout(() => {
      const next = waiting.values().next().value;
      waiting.delete(next!);
    }, 80);

    // After 160ms: remove the rest.
    setTimeout(() => {
      waiting.clear();
    }, 160);

    await drained;
    expect(resolved).toBe(true);
    expect(waiting.size).toBe(0);
  });

  it('falls back to the ceiling when elements are stuck', async () => {
    const waiting = new Set([{ id: 'forever' }]);
    const start = Date.now();
    await drainWaitingElements(waiting, 50);
    const elapsed = Date.now() - start;
    // should bail at ~50ms, not run forever.
    expect(elapsed).toBeGreaterThanOrEqual(45);
    expect(elapsed).toBeLessThan(500);
    // element remains; the ceiling is a hard cap, not a force-removal.
    expect(waiting.size).toBe(1);
  });
});
