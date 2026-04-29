import { describe, it, expect, render, waitForExist, h } from '@stencil/vitest';

describe('style-mode-shadow', () => {
  it('applies default mode (buford) styles', async () => {
    const { root } = await render(<style-mode-shadow>content</style-mode-shadow>);

    const styles = getComputedStyle(root);
    expect(styles.backgroundColor).toBe('rgb(255, 255, 0)'); // yellow
  });

  it('applies griff mode styles when mode attribute is set', async () => {
    const { root } = await render(<style-mode-shadow mode='griff'>content</style-mode-shadow>);

    const styles = getComputedStyle(root);
    expect(styles.backgroundColor).toBe('rgb(255, 0, 0)'); // red
  });

  it('applies buford mode styles when mode attribute is explicitly set', async () => {
    const { root } = await render(<style-mode-shadow mode='buford'>content</style-mode-shadow>);

    const styles = getComputedStyle(root);
    expect(styles.backgroundColor).toBe('rgb(255, 255, 0)'); // yellow
  });
});
