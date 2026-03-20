import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-parent-tag-change', () => {
  describe('direct slot', () => {
    it('should relocate the text node to the slot after the parent tag changes', async () => {
      const { root, waitForChanges } = await render(
        <slot-parent-tag-change id="top-level"> Hello </slot-parent-tag-change>,
      );
      await waitForExist('slot-parent-tag-change.hydrated');

      let children = document.querySelectorAll('#top-level > *');

      expect(children.length).toBe(1);
      expect(children[0].tagName).toBe('P');
      expect(children[0].textContent!.trim()).toBe('Hello');

      root.setAttribute('element', 'span');
      await waitForChanges();

      children = document.querySelectorAll('#top-level > *');
      expect(children.length).toBe(1);
      expect(children[0].tagName).toBe('SPAN');
      expect(children[0].textContent!.trim()).toBe('Hello');
    });
  });

  describe('nested slot', () => {
    it('should relocate the text node to the slot after the parent tag changes', async () => {
      const { root, waitForChanges } = await render(
        <slot-parent-tag-change-root> World </slot-parent-tag-change-root>,
      );
      await waitForExist('slot-parent-tag-change-root.hydrated');

      let children = root.querySelectorAll('slot-parent-tag-change > *');

      expect(children).not.toBeNull();
      expect(children.length).toBe(1);
      expect(children[0].tagName).toBe('P');
      expect(children[0].textContent!.trim()).toBe('World');

      root.setAttribute('element', 'span');
      await waitForChanges();

      children = root.querySelectorAll('slot-parent-tag-change > *');
      expect(children.length).toBe(1);
      expect(children[0].tagName).toBe('SPAN');
      expect(children[0].textContent!.trim()).toBe('World');
    });
  });
});
