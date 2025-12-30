import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

/**
 * Tests for projected content to be hidden in a `scoped` component
 * when it has no destination slot.
 */
describe('slot-hide-content', function () {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <slot-hide-content-scoped className="test-cmp">
            <p id="slotted-1">Hello</p>
          </slot-hide-content-scoped>

          <slot-hide-content-open className="test-cmp">
            <p id="slotted-2">Hello</p>
          </slot-hide-content-open>

          <button type="button">Enable slot</button>
        </>
      ),
    });

    await $('button').waitForExist();

    document.querySelector('button').addEventListener('click', () => {
      document.querySelectorAll('.test-cmp').forEach((ref) => ref.setAttribute('enabled', true));
    });
  });

  describe('scoped encapsulation', () => {
    it('should hide content when no slot is provided', async () => {
      const host = document.body.querySelector('slot-hide-content-scoped');
      const slottedContent = host.querySelector('#slotted-1');

      expect(slottedContent).toBeDefined();
      expect(slottedContent.hasAttribute('hidden')).toBe(true);
      expect(slottedContent.parentElement.tagName).toContain('SLOT-HIDE-CONTENT-SCOPED');

      document.querySelector('button').click();
      await browser.pause();

      expect(slottedContent.hasAttribute('hidden')).toBe(false);
      expect(slottedContent.parentElement.classList).toContain('slot-wrapper');
    });
  });

  describe('no encapsulation', () => {
    it('should not hide content when no slot is provided', async () => {
      const host = document.body.querySelector('slot-hide-content-open');
      const slottedContent = host.querySelector('#slotted-2');

      expect(slottedContent).toBeDefined();
      expect(slottedContent.hasAttribute('hidden')).toBe(false);
      expect(slottedContent.parentElement.tagName).toContain('SLOT-HIDE-CONTENT-OPEN');

      document.querySelector('button').click();
      await browser.pause();

      expect(slottedContent.hasAttribute('hidden')).toBe(false);
      expect(slottedContent.parentElement.classList).toContain('slot-wrapper');
    });
  });
});
