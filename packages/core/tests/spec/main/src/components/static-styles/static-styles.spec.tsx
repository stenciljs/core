import { render, h, describe, it, expect } from '@stencil/vitest';

describe('static-styles', () => {
  it('applies styles from static getter', async () => {
    const { root } = await render(<static-styles />);

    const h1 = root.querySelector('h1') as HTMLElement;
    const style = window.getComputedStyle(h1);
    expect(style.color).toBe('rgb(255, 0, 0)');
  });
});
