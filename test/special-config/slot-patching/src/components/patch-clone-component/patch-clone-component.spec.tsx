/**
 * Tests for per-component slot patching with `patches: ['clone']`.
 *
 * This patch enables cloneNode() to properly handle slotted content,
 * including the slotted nodes in the cloned element.
 */
import { describe, it, expect, h, render } from '@stencil/vitest';

describe('per-component slot patching - patches: ["clone"]', () => {
  it('should render slotted content', async () => {
    const { root } = await render(
      <patch-clone-component>
        <span>Slotted content</span>
      </patch-clone-component>,
    );

    const el = root;
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('Slotted content');
  });

  it('cloneNode(true) should include slotted content', async () => {
    const { root } = await render(
      <patch-clone-component>
        <span id='to-clone'>Clone me</span>
      </patch-clone-component>,
    );

    const el = root;
    const clone = el?.cloneNode(true) as Element;

    // With patches: ['clone'], deep clone should include slotted content
    expect(clone.querySelector('#to-clone')).toBeTruthy();
    expect(clone.textContent).toContain('Clone me');
  });

  it('cloneNode(true) should clone multiple slotted children', async () => {
    const { root } = await render(
      <patch-clone-component>
        <span id='child1'>First</span>
        <span id='child2'>Second</span>
        <span id='child3'>Third</span>
      </patch-clone-component>,
    );

    const el = root;
    const clone = el?.cloneNode(true) as Element;

    expect(clone.querySelector('#child1')).toBeTruthy();
    expect(clone.querySelector('#child2')).toBeTruthy();
    expect(clone.querySelector('#child3')).toBeTruthy();
  });

  it('cloneNode(false) should not include children', async () => {
    const { root } = await render(
      <patch-clone-component>
        <span id='child'>Child</span>
      </patch-clone-component>,
    );

    const el = root;
    const clone = el?.cloneNode(false) as Element;

    // Shallow clone should not include any children
    expect(clone.querySelector('#child')).toBeNull();
    expect(clone.childNodes.length).toBe(0);
  });

  it('cloned slotted content should be independent', async () => {
    const { root } = await render(
      <patch-clone-component>
        <span id='original'>Original text</span>
      </patch-clone-component>,
    );

    const el = root;
    const clone = el?.cloneNode(true) as Element;

    // Modify the clone
    const clonedSpan = clone.querySelector('#original');
    if (clonedSpan) clonedSpan.textContent = 'Modified text';

    // Original should be unchanged
    const originalSpan = el.querySelector('#original');
    expect(originalSpan?.textContent).toBe('Original text');
    expect(clonedSpan?.textContent).toBe('Modified text');
  });
});
