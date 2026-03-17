import { render, h, describe, it, expect } from '@stencil/vitest';

describe('style-plugin', () => {
  describe('sass-cmp', () => {
    it('applies sass styles correctly', async () => {
      const { root } = await render(<sass-cmp />);
      const shadowRoot = root.shadowRoot!;

      const sassEntry = shadowRoot.querySelector('.sass-entry')!;
      const sassImportee = shadowRoot.querySelector('.sass-importee')!;
      const cssImportee = shadowRoot.querySelector('.css-importee')!;
      const bootstrapBtn = shadowRoot.querySelector('.btn-primary')!;
      const hr = shadowRoot.querySelector('hr')!;

      expect(window.getComputedStyle(sassEntry).color).toBe('rgb(255, 0, 0)');
      expect(window.getComputedStyle(sassImportee).color).toBe('rgb(0, 128, 0)');
      expect(window.getComputedStyle(cssImportee).color).toBe('rgb(0, 0, 255)');
      expect(window.getComputedStyle(bootstrapBtn).color).toBe('rgb(255, 255, 255)');
      expect(window.getComputedStyle(hr).height).toBe('0px');
    });
  });

  describe('css-cmp', () => {
    it('applies css styles correctly', async () => {
      const { root } = await render(<css-cmp />);
      const shadowRoot = root.shadowRoot!;

      const cssEntry = shadowRoot.querySelector('.css-entry')!;
      const cssImportee = shadowRoot.querySelector('.css-importee')!;
      const hr = shadowRoot.querySelector('hr')!;

      expect(window.getComputedStyle(cssEntry).color).toBe('rgb(128, 0, 128)');
      expect(window.getComputedStyle(cssImportee).color).toBe('rgb(0, 0, 255)');
      expect(window.getComputedStyle(hr).height).toBe('0px');
    });
  });

  describe('multiple-styles-cmp', () => {
    it('applies multiple styleUrls in correct order', async () => {
      const { root } = await render(<multiple-styles-cmp />);
      const shadowRoot = root.shadowRoot!;

      const h1 = window.getComputedStyle(shadowRoot.querySelector('h1')!);
      const p = window.getComputedStyle(shadowRoot.querySelector('p')!);

      // color is red because foo.scss is mentioned last and overwrites bar.scss
      expect(h1.color).toBe('rgb(255, 0, 0)');
      expect(p.color).toBe('rgb(255, 0, 0)');

      // ensure styles defined in bar.scss are applied too
      expect(h1.fontStyle).toBe('italic');
      expect(p.fontStyle).toBe('italic');
    });
  });
});
