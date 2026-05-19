import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-hide-content', () => {
  describe('scoped encapsulation', () => {
    it('should hide content when no slot is provided', async () => {
      const { root, waitForChanges } = await render(
        <slot-hide-content-scoped class='test-cmp'>
          <p id='slotted-1'>Hello</p>
        </slot-hide-content-scoped>,
      );
      const host = root;
      const slottedContent = host.querySelector('#slotted-1')!;

      expect(slottedContent).toBeTruthy();
      expect(slottedContent.hasAttribute('hidden')).toBe(true);
      expect(slottedContent.parentElement!.tagName).toContain('SLOT-HIDE-CONTENT-SCOPED');

      host.setAttribute('enabled', 'true');
      await waitForChanges();

      expect(slottedContent.hasAttribute('hidden')).toBe(false);
      // slottedContent is inside <slot> which is inside .slot-wrapper
      expect(slottedContent.closest('.slot-wrapper')).not.toBeNull();
    });
  });
});
