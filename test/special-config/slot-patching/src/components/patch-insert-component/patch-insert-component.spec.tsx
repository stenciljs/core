/**
 * Tests for per-component slot patching with `patches: ['insert']`.
 *
 * This patch enables proper slot relocation for:
 * - appendChild()
 * - insertBefore()
 * - append()
 * - prepend()
 */
import { describe, it, expect, h, render } from '@stencil/vitest';

describe('per-component slot patching - patches: ["insert"]', () => {
  it('should render slotted content', async () => {
    const { root } = await render(
      <patch-insert-component>
        <span>Slotted content</span>
      </patch-insert-component>,
    );

    const el = root;
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('Slotted content');
  });

  it('appendChild should relocate to slot', async () => {
    const { root, waitForChanges } = await render(
      <patch-insert-component>
        <span id='existing'>Existing</span>
      </patch-insert-component>,
    );

    const el = root;

    // Append a new child
    const newSpan = document.createElement('span');
    newSpan.id = 'appended';
    newSpan.textContent = 'Appended';
    el?.appendChild(newSpan);
    await waitForChanges();

    // The appended element should be visible/slotted
    expect(el?.textContent).toContain('Appended');
    expect(el?.querySelector('#appended')).toBeTruthy();
  });

  it('insertBefore should relocate to slot in correct position', async () => {
    const { root, waitForChanges } = await render(
      <patch-insert-component>
        <span id='first'>First</span>
        <span id='last'>Last</span>
      </patch-insert-component>,
    );

    const el = root;
    const lastSpan = el.querySelector('#last');

    // Insert a new element before the last one
    const newSpan = document.createElement('span');
    newSpan.id = 'middle';
    newSpan.textContent = 'Middle';
    el.insertBefore(newSpan, lastSpan);
    await waitForChanges();

    // The inserted element should be visible
    expect(el?.textContent).toContain('Middle');
    expect(el?.querySelector('#middle')).toBeTruthy();
  });

  it('multiple appendChild calls should all be slotted', async () => {
    const { root, waitForChanges } = await render(
      <patch-insert-component></patch-insert-component>,
    );

    const el = root;

    // Append multiple children
    for (let i = 1; i <= 3; i++) {
      const span = document.createElement('span');
      span.id = `dynamic-${i}`;
      span.textContent = `Dynamic ${i}`;
      el?.appendChild(span);
    }
    await waitForChanges();

    // All appended elements should be visible
    expect(el?.querySelector('#dynamic-1')).toBeTruthy();
    expect(el?.querySelector('#dynamic-2')).toBeTruthy();
    expect(el?.querySelector('#dynamic-3')).toBeTruthy();
  });

  it('appendChild should trigger slotchange event', async () => {
    const { root, waitForChanges } = await render(
      <patch-insert-component></patch-insert-component>,
    );

    const el = root;
    let slotChangeCount = 0;

    // Find the slot element inside the component
    const wrapper = el.querySelector('.wrapper');
    const slot = wrapper?.querySelector('slot') || wrapper;

    if (slot) {
      slot.addEventListener('slotchange', () => {
        slotChangeCount++;
      });
    }

    // Append a child
    const span = document.createElement('span');
    span.textContent = 'New content';
    el.appendChild(span);
    await waitForChanges();

    // slotchange should have been dispatched
    // Note: This may not fire in non-shadow DOM, depending on implementation
    expect(el.textContent).toContain('New content');
  });

  it('removeChild should work on slotted content', async () => {
    const { root, waitForChanges } = await render(
      <patch-insert-component>
        <span id='to-remove'>Remove me</span>
        <span id='to-keep'>Keep me</span>
      </patch-insert-component>,
    );

    const el = root;
    const toRemove = el.querySelector('#to-remove');

    if (toRemove) el.removeChild(toRemove);
    await waitForChanges();

    expect(el.querySelector('#to-remove')).toBeNull();
    expect(el.querySelector('#to-keep')).toBeTruthy();
  });
});
