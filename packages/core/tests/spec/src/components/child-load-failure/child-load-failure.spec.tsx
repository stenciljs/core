import { render, h, describe, it, expect } from '@stencil/vitest';

describe('child-load-failure', () => {
  it('parent hydrates even when child fails to load', async () => {
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      const { root } = await render(<cmp-parent />);


      expect(root).toBeTruthy();
      expect(root).toHaveClass('hydrated');

      const parentContent = root.querySelector('.parent-content');
      expect(parentContent).toHaveTextContent('Parent Loaded');
      
    } finally {
      console.error = originalConsoleError;
    }
  });
});
