import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

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
describe('Mixin slot detection', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-mixin-slot/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      frameEle.waitUntil(async () => !!frameContent.querySelector('.component-root'), { timeout: 5000 });
    });

    it('renders slotted content inside the mixin wrapper', async () => {
      const cmp = frameContent.querySelector('extends-mixin-slot-cmp');
      expect(cmp).toBeDefined();

      // The slotted content should be within the component
      const slottedContent = cmp!.querySelector('.slotted-content');
      expect(slottedContent).toBeDefined();
      expect(slottedContent!.textContent).toBe('I am slotted content');

      // Verify the mixin structure is present
      const mixinWrapper = cmp!.querySelector('.mixin-wrapper');
      expect(mixinWrapper).toBeDefined();

      const header = cmp!.querySelector('.mixin-header');
      expect(header).toBeDefined();
      expect(header!.textContent).toBe('Mixin Content Header');

      const footer = cmp!.querySelector('.mixin-footer');
      expect(footer).toBeDefined();
      expect(footer!.textContent).toBe('Mixin Content Footer');
    });

    it('slotted content should not be outside the component', async () => {
      // If slot detection failed, the slotted content would be dumped at body level
      const bodySlottedContent = frameContent.querySelector(':scope > .slotted-content');
      expect(bodySlottedContent).toBeNull();
    });
  });

  describe('es2022 dist-custom-elements output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      await browser.switchToParentFrame();
      frameContent = await setupIFrameTest('/extends-mixin-slot/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      frameEle.waitUntil(async () => !!frameContent.querySelector('.component-root'), { timeout: 5000 });
    });

    it('renders slotted content inside the mixin wrapper', async () => {
      const cmp = frameContent.querySelector('extends-mixin-slot-cmp');
      expect(cmp).toBeDefined();

      // The slotted content should be within the component
      const slottedContent = cmp!.querySelector('.slotted-content');
      expect(slottedContent).toBeDefined();
      expect(slottedContent!.textContent).toBe('I am slotted content');

      // Verify the mixin structure is present
      const mixinWrapper = cmp!.querySelector('.mixin-wrapper');
      expect(mixinWrapper).toBeDefined();

      const header = cmp!.querySelector('.mixin-header');
      expect(header).toBeDefined();
      expect(header!.textContent).toBe('Mixin Content Header');

      const footer = cmp!.querySelector('.mixin-footer');
      expect(footer).toBeDefined();
      expect(footer!.textContent).toBe('Mixin Content Footer');
    });

    it('slotted content should not be outside the component', async () => {
      // If slot detection failed, the slotted content would be dumped at body level
      const bodySlottedContent = frameContent.querySelector(':scope > .slotted-content');
      expect(bodySlottedContent).toBeNull();
    });
  });
});
