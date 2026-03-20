import { describe, it, expect, render, h } from '@stencil/vitest';

describe('extends-render', () => {
  describe('Render Method Inheritance', () => {
    it('inherits base render template structure', async () => {
      const { root } = await render(<extends-render />);

      expect(root.querySelector('.base-container')).toBeTruthy();
      expect(root.querySelector('.base-header')).toBeTruthy();
      expect(root.querySelector('.base-content')).toBeTruthy();
      expect(root.querySelector('.base-footer')).toBeTruthy();
    });

    it('composes parent template with child content', async () => {
      const { root } = await render(<extends-render />);

      // Child wrapper is present
      expect(root.querySelector('.component-wrapper')).toBeTruthy();

      // Child header is present
      expect(root.querySelector('.component-header')).toBeTruthy();
      expect(root.querySelector('.component-title')).toHaveTextContent('Extended Component');

      // Base template is still present (composed)
      expect(root.querySelector('.base-container')).toBeTruthy();

      // Additional component content is present
      expect(root.querySelector('.component-additional')).toBeTruthy();
    });

    it('maintains CSS classes from parent template', async () => {
      const { root } = await render(<extends-render />);

      const baseContainer = root.querySelector('.base-container');
      expect(baseContainer).toBeTruthy();
      expect(baseContainer?.classList.contains('base-container')).toBe(true);
      expect(baseContainer?.classList.contains('extended')).toBe(true);

      expect(root.querySelector('.base-header')?.classList.contains('base-header')).toBe(true);
      expect(root.querySelector('.base-title')?.classList.contains('base-title')).toBe(true);
      expect(root.querySelector('.base-footer')?.classList.contains('base-footer')).toBe(true);
    });

    it('includes base title from parent template', async () => {
      const { root } = await render(<extends-render />);

      expect(root.querySelector('.base-title')).toHaveTextContent('Extended Base Title');
    });

    it('includes base footer content from parent template', async () => {
      const { root } = await render(<extends-render />);

      expect(root.querySelector('.base-footer-text')).toHaveTextContent('Base footer content');
    });

    it('renders component-specific additional content', async () => {
      const { root } = await render(<extends-render />);

      expect(root.querySelector('.additional-content')).toHaveTextContent('Additional component content');
    });
  });
});
