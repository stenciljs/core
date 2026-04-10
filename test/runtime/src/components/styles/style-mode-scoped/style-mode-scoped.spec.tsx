import { describe, it, expect, render, waitForExist, h } from '@stencil/vitest';

describe('style-mode-scoped', () => {
  it('applies default mode (buford) styles', async () => {
    const { root } = await render(<style-mode-scoped>content</style-mode-scoped>, {
      waitForReady: false,
    });
    await waitForExist('style-mode-scoped.hydrated');

    const styles = getComputedStyle(root);
    expect(styles.backgroundColor).toBe('rgb(50, 205, 50)'); // limegreen
  });

  it('applies griff mode styles when mode attribute is set', async () => {
    const { root } = await render(<style-mode-scoped mode='griff'>content</style-mode-scoped>, {
      waitForReady: false,
    });
    await waitForExist('style-mode-scoped.hydrated');

    const styles = getComputedStyle(root);
    expect(styles.backgroundColor).toBe('rgb(221, 160, 221)'); // plum
  });

  it('applies buford mode styles when mode attribute is explicitly set', async () => {
    const { root } = await render(<style-mode-scoped mode='buford'>content</style-mode-scoped>, {
      waitForReady: false,
    });
    await waitForExist('style-mode-scoped.hydrated');

    const styles = getComputedStyle(root);
    expect(styles.backgroundColor).toBe('rgb(50, 205, 50)'); // limegreen
  });
});
