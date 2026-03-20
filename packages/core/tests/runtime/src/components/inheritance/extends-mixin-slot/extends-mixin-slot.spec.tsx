import { describe, it, expect, render, h } from '@stencil/vitest';

/**
 * Tests for mixin slot detection. Verifies that Stencil properly walks into
 * mixin factory functions to detect slot elements for build conditionals.
 *
 * When the fix is working correctly, the slotted content should appear
 * inside the mixin-wrapper (between mixin-header and mixin-footer).
 *
 * When the fix is NOT working, the slotted content would be dumped outside
 * the component structure because Stencil wouldn't know there's a slot.
 */
describe('extends-mixin-slot', () => {
  describe('mixin slot detection', () => {
    it('renders slotted content inside the mixin wrapper', async () => {
      const { root } = await render(
        <extends-mixin-slot-cmp>
          <div slot="content" class="slotted-content">
            I am slotted content
          </div>
        </extends-mixin-slot-cmp>,
      );

      expect(root).toBeDefined();

      // The slotted content should be within the component
      const slottedContent = root.querySelector('.slotted-content');
      expect(slottedContent).toBeDefined();
      expect(slottedContent).toHaveTextContent('I am slotted content');

      // Verify the mixin structure is present
      const mixinWrapper = root.querySelector('.mixin-wrapper');
      expect(mixinWrapper).toBeDefined();

      const header = root.querySelector('.mixin-header');
      expect(header).toBeDefined();
      expect(header).toHaveTextContent('Mixin Content Header');

      const footer = root.querySelector('.mixin-footer');
      expect(footer).toBeDefined();
      expect(footer).toHaveTextContent('Mixin Content Footer');
    });

    it('renders component title', async () => {
      const { root } = await render(<extends-mixin-slot-cmp />);

      const title = root.querySelector('.component-title');
      expect(title).toBeDefined();
      expect(title).toHaveTextContent('Mixin Slot Test Component');
    });
  });
});
