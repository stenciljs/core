/**
 * Tests for the non-shadow component WITHOUT the app-data alias.
 *
 * The `no-app-data` project uses the default static `@stencil/core/runtime/app-data`
 * blob, which has slotChildNodes: true. Slot DOM patches should be applied.
 */
import { describe, it, expect, h, render } from '@stencil/vitest';

describe('non-shadow - no app-data (patches applied)', () => {
  it('childNodes returns only slotted nodes, not internal DOM', async () => {
    const { root } = await render(
      <non-shadow>
        <p class='slotted'>Hello</p>
      </non-shadow>,
    );

    const childNodeNames = Array.from(root.childNodes).map((n) => n.nodeName);

    // Patched: childNodes reflects slotted content only
    expect(childNodeNames).toContain('P');
    expect(childNodeNames).not.toContain('DIV');
  });
});
