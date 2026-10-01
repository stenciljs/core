import { render, describe, it, expect, waitForStable } from '@stencil/vitest';

// Regression test for https://github.com/stenciljs/core/issues/6636
describe('connected-callback-race', () => {
  it("parent's componentWillLoad observes a pre-existing (slotted) child's connectedCallback, even when the child's module resolves after the parent's", async () => {
    const { waitForChanges } = await render(
      '<div><ol id="connected-callback-race-log"></ol><connected-callback-race-parent><connected-callback-race-child></connected-callback-race-child></connected-callback-race-parent></div>',
    );

    await waitForChanges();
    await waitForStable('#connected-callback-race-log');

    const logs = document.querySelectorAll('#connected-callback-race-log li');
    expect(logs).toHaveLength(3);
    expect(logs[0]).toHaveTextContent('parent-connectedCallback');
    expect(logs[1]).toHaveTextContent('child-connectedCallback');
    expect(logs[2]).toHaveTextContent('parent-componentWillLoad saw-child=true');
  });

  it("parent's componentWillLoad observes a deferred (non-shadow, own-slot) child's connectedCallback", async () => {
    const { waitForChanges } = await render(
      '<div><ol id="connected-callback-race-deferred-log"></ol><connected-callback-race-deferred-parent><connected-callback-race-deferred-child></connected-callback-race-deferred-child></connected-callback-race-deferred-parent></div>',
    );

    await waitForChanges();
    await waitForStable('#connected-callback-race-deferred-log');

    const logs = document.querySelectorAll('#connected-callback-race-deferred-log li');
    expect(logs).toHaveLength(3);
    expect(logs[0]).toHaveTextContent('deferred-parent-connectedCallback');
    expect(logs[1]).toHaveTextContent('deferred-child-connectedCallback');
    expect(logs[2]).toHaveTextContent('deferred-parent-componentWillLoad saw-child=true');
  });
});
