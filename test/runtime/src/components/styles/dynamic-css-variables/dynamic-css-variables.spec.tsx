import { render, h, describe, it, expect } from '@stencil/vitest';

describe('dynamic-css-variables', () => {
  it('should dynamically change the inline css variable', async () => {
    const { root, waitForChanges } = await render(<dynamic-css-variable />);

    const header = root.querySelector('header')!;
    let styles = window.getComputedStyle(header);
    expect(styles.color).toBe('rgb(0, 0, 255)');

    const button = root.querySelector('button')!;
    button.click();
    await waitForChanges();

    styles = window.getComputedStyle(header);
    expect(styles.color).toBe('rgb(255, 255, 255)');

    button.click();
    await waitForChanges();

    styles = window.getComputedStyle(header);
    expect(styles.color).toBe('rgb(0, 0, 255)');
  });
});
