/**
 * Tests for per-component slot patching with `patches: ['children']`.
 *
 * This patch enables correct reporting of slotted content via:
 * - childNodes
 * - children
 * - firstChild
 * - lastChild
 * - childElementCount
 */
import { describe, it, expect, h, render } from '@stencil/vitest';

describe('per-component slot patching - patches: ["children"]', () => {
  it('should render slotted content', async () => {
    const { root } = await render(
      <patch-children-component>
        <span>Slotted content</span>
      </patch-children-component>,
    );

    const el = root;
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('Slotted content');
  });

  it('childNodes should return slotted nodes', async () => {
    const { root } = await render(
      <patch-children-component>
        <span id='child1'>First</span>
        <span id='child2'>Second</span>
      </patch-children-component>,
    );

    const el = root;
    const childNodes = el?.childNodes;

    // With patches: ['children'], childNodes should return the slotted content
    const spans = Array.from(childNodes || []).filter(
      (n) => n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === 'SPAN',
    );
    expect(spans.length).toBe(2);
  });

  it('children should return slotted elements', async () => {
    const { root } = await render(
      <patch-children-component>
        <span id='child1'>First</span>
        <span id='child2'>Second</span>
      </patch-children-component>,
    );

    const el = root;
    const children = el?.children;

    const spans = Array.from(children || []).filter((n) => n.tagName === 'SPAN');
    expect(spans.length).toBe(2);
  });

  it('firstChild should return first slotted node', async () => {
    const { root } = await render(
      <patch-children-component>
        <span id='first'>First</span>
        <span id='second'>Second</span>
      </patch-children-component>,
    );

    const el = root;
    const firstChild = el?.firstChild as Element;

    expect(firstChild).toBeTruthy();
    expect(firstChild.id).toBe('first');
  });

  it('lastChild should return last slotted node', async () => {
    const { root } = await render(
      <patch-children-component>
        <span id='first'>First</span>
        <span id='second'>Second</span>
      </patch-children-component>,
    );

    const el = root;
    const lastChild = el?.lastChild as Element;

    expect(lastChild).toBeTruthy();
    expect(lastChild.id).toBe('second');
  });

  it('childElementCount should return count of slotted elements', async () => {
    const { root } = await render(
      <patch-children-component>
        <span>One</span>
        <span>Two</span>
        <span>Three</span>
      </patch-children-component>,
    );

    const el = root;
    expect(el.childElementCount).toBe(3);
  });
});
