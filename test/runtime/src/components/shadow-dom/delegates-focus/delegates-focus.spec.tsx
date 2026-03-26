import { render, h, describe, it, expect } from '@stencil/vitest';

describe('delegates-focus', () => {
  it('should delegate focus', async () => {
    const { root, waitForChanges } = await render(
      <div>
        <delegates-focus class='set-focus' />
        <no-delegates-focus class='set-focus' />
      </div>,
    );

    const delegatesFocus = root.querySelector('delegates-focus')! as HTMLElement;
    const noDelegatesFocus = root.querySelector('no-delegates-focus')! as HTMLElement;

    // Initial state - both have red border
    expect(getComputedStyle(delegatesFocus).borderColor).toBe('rgb(255, 0, 0)');
    expect(getComputedStyle(noDelegatesFocus).borderColor).toBe('rgb(255, 0, 0)');

    // Focus BOTH elements in sequence (like the original test does via button click)
    // The key is that no-delegates-focus is focused LAST
    const elms = root.querySelectorAll('.set-focus');
    for (let i = 0; i < elms.length; i++) {
      (elms[i] as HTMLElement).focus();
    }
    await waitForChanges();

    // delegates-focus should have blue border (focus was delegated to its inner input,
    // and since no-delegates-focus doesn't delegate, focus stays on delegates-focus's input)
    expect(getComputedStyle(delegatesFocus).borderColor).toBe('rgb(0, 0, 255)');

    // no-delegates-focus should still have red border (focus was NOT delegated,
    // so calling .focus() on it didn't actually focus anything inside)
    expect(getComputedStyle(noDelegatesFocus).borderColor).toBe('rgb(255, 0, 0)');
  });
});
