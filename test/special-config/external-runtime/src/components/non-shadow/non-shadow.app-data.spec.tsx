/**
 * Tests for the non-shadow component WITH the collection app-data alias.
 *
 * The `with-app-data` project aliases `@stencil/core/runtime/app-data` to
 * `dist/collection/app-data.js`, which has slotChildNodes: false (matching
 * the lib's lightDomPatches: false config). Slot DOM patches should NOT be applied.
 */
import { describe, it, expect, h, render } from '@stencil/vitest';

describe('non-shadow - with app-data (patches not applied)', () => {
  it('childNodes returns native DOM including internal elements', async () => {
    const { root } = await render(
      <non-shadow>
        <p class='slotted'>Hello</p>
      </non-shadow>,
    );

    const childNodeNames = Array.from(root.childNodes).map((n) => n.nodeName);

    // Unpatched: childNodes reflects actual DOM, internal div is visible
    expect(childNodeNames).toContain('DIV');
  });
});
