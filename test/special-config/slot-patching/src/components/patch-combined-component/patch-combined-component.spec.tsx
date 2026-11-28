/**
 * Tests for per-component slot patching with combined patches:
 * `patches: ['children', 'clone', 'insert']`
 *
 * This verifies that multiple individual patches can be combined
 * and work together correctly.
 */
import { describe, it, expect, h, render } from '@stencil/vitest';

describe('per-component slot patching - combined patches', () => {
  it('should render slotted content', async () => {
    const { root } = await render(
      <patch-combined-component>
        <span>Slotted content</span>
      </patch-combined-component>,
    );

    const el = root;
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('Slotted content');
  });

  // Test children patch
  it('childNodes should return slotted nodes (children patch)', async () => {
    const { root } = await render(
      <patch-combined-component>
        <span id='child1'>First</span>
        <span id='child2'>Second</span>
      </patch-combined-component>,
    );

    const el = root;
    const spans = Array.from(el?.childNodes || []).filter(
      (n) => n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === 'SPAN',
    );
    expect(spans.length).toBe(2);
  });

  it('firstChild/lastChild should work (children patch)', async () => {
    const { root } = await render(
      <patch-combined-component>
        <span id='first'>First</span>
        <span id='last'>Last</span>
      </patch-combined-component>,
    );

    const el = root;
    expect((el?.firstChild as Element).id).toBe('first');
    expect((el?.lastChild as Element).id).toBe('last');
  });

  // Test clone patch
  it('cloneNode should include slotted content (clone patch)', async () => {
    const { root } = await render(
      <patch-combined-component>
        <span id='to-clone'>Clone me</span>
      </patch-combined-component>,
    );

    const el = root;
    const clone = el?.cloneNode(true) as Element;

    expect(clone.querySelector('#to-clone')).toBeTruthy();
    expect(clone.textContent).toContain('Clone me');
  });

  // Test insert patch
  it('appendChild should relocate to slot (insert patch)', async () => {
    const { root, waitForChanges } = await render(
      <patch-combined-component>
        <span id='existing'>Existing</span>
      </patch-combined-component>,
    );

    const el = root;

    const newSpan = document.createElement('span');
    newSpan.id = 'appended';
    newSpan.textContent = 'Appended';
    el?.appendChild(newSpan);
    await waitForChanges();

    expect(el?.textContent).toContain('Appended');
    expect(el?.querySelector('#appended')).toBeTruthy();
  });

  // Test combined behavior
  it('appendChild then check children (combined)', async () => {
    const { root, waitForChanges } = await render(
      <patch-combined-component>
        <span id='initial'>Initial</span>
      </patch-combined-component>,
    );

    const el = root;

    // Use insert patch to add element
    const newSpan = document.createElement('span');
    newSpan.id = 'added';
    newSpan.textContent = 'Added';
    el.appendChild(newSpan);
    await waitForChanges();

    // Use children patch to verify
    const children = Array.from(el?.children || []);
    expect(children.length).toBe(2);
    expect(children.some((c) => c.id === 'initial')).toBe(true);
    expect(children.some((c) => c.id === 'added')).toBe(true);
  });

  it('clone after appendChild (combined)', async () => {
    const { root, waitForChanges } = await render(
      <patch-combined-component>
        <span id='original'>Original</span>
      </patch-combined-component>,
    );

    const el = root;

    // Add a new element
    const newSpan = document.createElement('span');
    newSpan.id = 'dynamic';
    newSpan.textContent = 'Dynamic';
    el.appendChild(newSpan);
    await waitForChanges();

    // Clone should include both original and dynamically added content
    const clone = el.cloneNode(true) as Element;
    expect(clone.querySelector('#original')).toBeTruthy();
    expect(clone.querySelector('#dynamic')).toBeTruthy();
  });
});
