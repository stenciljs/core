import { BUILD } from '@app-data';
import { Component, h, Prop, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

/**
 * Regression test for the `taskQueue: 'immediate'` reentrancy hole.
 *
 * The re-render de-dup / reentrancy guard relies on `HOST_FLAGS.isQueuedForUpdate`.
 * Previously BOTH its set (scheduleUpdate) and clear (callRender) were gated behind
 * `BUILD.taskQueue`, so under `immediate` (BUILD.taskQueue === false) the flag was
 * never set. Because scheduleUpdate dispatches synchronously in that mode, a state
 * write during render() (e.g. the common "measure the DOM, then setState" pattern)
 * re-entered the render synchronously and unbounded — and could corrupt an in-flight
 * vdom patch.
 *
 * The guard is now gated on `BUILD.updatable` only, so a single external update
 * triggers a single follow-up render in BOTH scheduling modes.
 */
describe("scheduleUpdate reentrancy guard (taskQueue: 'immediate')", () => {
  const CAP = 60;
  let renderCount = 0;

  @Component({ tag: 'cmp-reentry' })
  class CmpReentry {
    // external re-render trigger
    @Prop() trigger = 0;
    // simulates "measure the DOM, then set state during render" (truncation pattern)
    @State() measured = 0;

    render() {
      renderCount++;
      // Ask for another render from within render(). The guard must coalesce this;
      // the CAP only prevents a hang if the guard is broken.
      if (renderCount <= CAP) {
        this.measured++;
      }
      return <div>{this.measured}</div>;
    }
  }

  const originalTaskQueue = BUILD.taskQueue;

  beforeEach(() => {
    renderCount = 0;
  });

  afterEach(() => {
    BUILD.taskQueue = originalTaskQueue;
  });

  it('async: a state write during render() is coalesced — 1 render per external update', async () => {
    BUILD.taskQueue = true;

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpReentry],
      html: `<cmp-reentry></cmp-reentry>`,
    });
    expect(renderCount).toBe(1);

    (root as any).trigger = 1;
    await waitForChanges();

    expect(renderCount).toBe(2);
  });

  it('immediate: a state write during render() is coalesced — does NOT re-enter unbounded', async () => {
    // mount in async mode so the initial render behaves identically
    BUILD.taskQueue = true;
    const { root, waitForChanges } = await newSpecPage({
      components: [CmpReentry],
      html: `<cmp-reentry></cmp-reentry>`,
    });
    await waitForChanges();
    expect(renderCount).toBe(1);

    // switch the platform to 'immediate' and fire a single external update
    BUILD.taskQueue = false;
    renderCount = 0;

    (root as any).trigger = 1;
    await waitForChanges();

    // With the guard active, one external update == one follow-up render.
    // Before the fix this was CAP + 1 (runaway synchronous reentrancy).
    expect(renderCount).toBe(1);
  });
});
