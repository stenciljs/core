import { render, h, describe, it, expect } from '@stencil/vitest';

describe('textContent patch', () => {
  describe('scoped encapsulation', () => {
    it('should return the content of all slots', async () => {
      const { root } = await render(
        <text-content-patch-scoped-with-slot>
          Slot content
          <p slot='suffix'>Suffix content</p>
        </text-content-patch-scoped-with-slot>,
      );

      expect(root.textContent).toContain('Slot content');
      expect(root.textContent).toContain('Suffix content');
    });

    it('should have default behaviour when there is no default slot', async () => {
      const { root } = await render(<text-content-patch-scoped />);

      expect(root.textContent).toContain('Top content');
      expect(root.textContent).toContain('Bottom content');
    });

    it('should overwrite the default slot content', async () => {
      const { root, waitForChanges } = await render(
        <text-content-patch-scoped-with-slot>
          Slot content
          <p slot='suffix'>Suffix content</p>
        </text-content-patch-scoped-with-slot>,
      );

      root.textContent = 'New slot content';
      await waitForChanges();

      expect(root.textContent).toBe('New slot content');
    });

    it('should insert text node if there is no default slot', async () => {
      const { root, waitForChanges } = await render(<text-content-patch-scoped />);

      root.textContent = 'New slot content';
      await waitForChanges();

      expect(root.textContent).toBe('New slot content');
    });
  });
});
