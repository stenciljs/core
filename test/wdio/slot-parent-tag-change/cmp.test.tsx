import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

/**
 * Tests the cases where a node is slotted in and the slot's parent element dynamically changes
 * (e.g. from `p` to `span`).
 */
describe('slot-parent-tag-change', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          {/*Test "top-level" slot*/}
          <slot-parent-tag-change id="top-level"> Hello </slot-parent-tag-change>
          {/*Test nested slot*/}
          <slot-parent-tag-change-root> World </slot-parent-tag-change-root>

          <button type="button" id="top-level-button">
            Change Top-Level Slot
          </button>
          <button type="button" id="nested-button">
            Change Nested Slot
          </button>
        </>
      ),
    });

    await $('slot-parent-tag-change').waitForExist();

    document.querySelector('#top-level-button').addEventListener('click', () => {
      document.querySelector('#top-level').setAttribute('element', 'span');
    });
    document.querySelector('#nested-button').addEventListener('click', () => {
      document.querySelector('slot-parent-tag-change-root').setAttribute('element', 'span');
    });
  });

  describe('direct slot', () => {
    it('should relocate the text node to the slot after the parent tag changes', async () => {
      const root = document.querySelector('#top-level');

      expect(root.children.length).toBe(1);
      expect(root.children[0].tagName).toBe('P');
      expect(root.children[0].textContent.trim()).toBe('Hello');

      await $('#top-level-button').click();
      await browser.pause();

      expect(root.children.length).toBe(1);
      expect(root.children[0].tagName).toBe('SPAN');
      expect(root.children[0].textContent.trim()).toBe('Hello');
    });
  });

  describe('nested slot', () => {
    it('should relocate the text node to the slot after the parent tag changes', async () => {
      const root = document.querySelector('slot-parent-tag-change-root slot-parent-tag-change');

      expect(root).not.toBeNull();
      expect(root.children.length).toBe(1);
      expect(root.children[0].tagName).toBe('P');
      expect(root.children[0].textContent.trim()).toBe('World');

      await $('#nested-button').click();
      await browser.pause();

      expect(root.children.length).toBe(1);
      expect(root.children[0].tagName).toBe('SPAN');
      expect(root.children[0].textContent.trim()).toBe('World');
    });
  });
});
