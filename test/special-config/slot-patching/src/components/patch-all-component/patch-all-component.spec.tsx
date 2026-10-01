/**
 * Tests for per-component slot patching with `patches: ['all']`.
 *
 * These tests verify that components using per-component patches
 * correctly report slotted content via patched DOM APIs like:
 * - childNodes / children
 * - firstChild / lastChild
 * - appendChild / insertBefore
 * - cloneNode
 */
import { describe, it, expect, h, render } from '@stencil/vitest';

describe('per-component slot patching - patches: ["all"]', () => {
  it('should render slotted content', async () => {
    const { root } = await render(
      <patch-all-component>
        <span>Slotted content</span>
      </patch-all-component>,
    );

    const el = root;
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('Slotted content');
  });

  it('childNodes should return slotted nodes (patched)', async () => {
    const { root } = await render(
      <patch-all-component>
        <span id='child1'>First</span>
        <span id='child2'>Second</span>
      </patch-all-component>,
    );

    const el = root;
    const childNodes = el?.childNodes;

    // With patches: ['all'], childNodes should return the slotted content
    // (the spans), not the internal wrapper div
    const spans = Array.from(childNodes || []).filter(
      (n) => n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === 'SPAN',
    );
    expect(spans.length).toBe(2);
  });

  it('children should return slotted elements (patched)', async () => {
    const { root } = await render(
      <patch-all-component>
        <span id='child1'>First</span>
        <span id='child2'>Second</span>
      </patch-all-component>,
    );

    const el = root;
    const children = el?.children;

    // With patches: ['all'], children should return slotted elements
    const spans = Array.from(children || []).filter((n) => n.tagName === 'SPAN');
    expect(spans.length).toBe(2);
  });

  it('firstChild should return first slotted node (patched)', async () => {
    const { root } = await render(
      <patch-all-component>
        <span id='first'>First</span>
        <span id='second'>Second</span>
      </patch-all-component>,
    );

    const el = root;
    const firstChild = el?.firstChild as Element;

    // With patches, firstChild should be the first slotted element
    expect(firstChild).toBeTruthy();
    expect(firstChild.id).toBe('first');
  });

  it('lastChild should return last slotted node (patched)', async () => {
    const { root } = await render(
      <patch-all-component>
        <span id='first'>First</span>
        <span id='second'>Second</span>
      </patch-all-component>,
    );

    const el = root;
    const lastChild = el?.lastChild as Element;

    // With patches, lastChild should be the last slotted element
    expect(lastChild).toBeTruthy();
    expect(lastChild.id).toBe('second');
  });

  it('appendChild should add to slotted content (patched)', async () => {
    const { root, waitForChanges } = await render(
      <patch-all-component>
        <span id='existing'>Existing</span>
      </patch-all-component>,
    );

    const el = root;

    // Append a new child
    const newSpan = document.createElement('span');
    newSpan.id = 'appended';
    newSpan.textContent = 'Appended';
    el.appendChild(newSpan);
    await waitForChanges();

    // With patches, the appended child should appear in children
    const children = Array.from(el.children).filter((n) => n.tagName === 'SPAN');
    expect(children.length).toBe(2);
    expect(children.some((c) => c.id === 'appended')).toBe(true);
  });

  it('cloneNode should clone slotted content (patched)', async () => {
    const { root, waitForChanges } = await render(
      <patch-all-component>
        <span id='to-clone'>Clone me</span>
      </patch-all-component>,
    );

    const el = root;
    const clone = el.cloneNode(true) as Element;

    // With patches, deep clone should include slotted content
    root.parentElement?.appendChild(clone); // Append clone to DOM for querySelector to work
    await waitForChanges();
    expect(clone.querySelector('#to-clone')).toBeTruthy();
    expect(clone.textContent).toContain('Clone me');
  });
});

describe('per-component slot patching - no patches (control)', () => {
  it('should render slotted content', async () => {
    const { root } = await render(
      <no-patch-component>
        <span>Slotted content</span>
      </no-patch-component>,
    );

    const el = root;
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('Slotted content');
  });

  it('childNodes returns internal DOM without patches', async () => {
    const { root } = await render(
      <no-patch-component>
        <span id='child1'>First</span>
      </no-patch-component>,
    );

    const el = root;
    const childNodes = el.childNodes;

    // Without patches, childNodes returns the actual DOM structure
    // which includes the internal wrapper div
    expect(childNodes.length).toBeGreaterThan(0);
  });
});
