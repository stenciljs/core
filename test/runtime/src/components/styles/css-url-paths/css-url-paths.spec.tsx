import { render, h, waitForExist } from '@stencil/vitest';
import { describe, it, expect } from 'vitest';

describe('css-url-paths', () => {
  it('should not replace "relative to root" paths', async () => {
    const { root } = await render(<css-url-paths />, { waitForReady: false });
    await waitForExist('css-url-paths.hydrated');

    const el = root.querySelector('#relativeToRoot')!;
    let imagePath = window.getComputedStyle(el).getPropertyValue('background-image');
    imagePath = imagePath.replace(/"/g, '');
    imagePath = imagePath.replace(/'/g, '');
    expect(imagePath).toBe(`url(${window.location.origin}/assets/favicon.ico?relativeToRoot)`);
  });

  it('should not replace "absolute" paths', async () => {
    const { root } = await render(<css-url-paths />, { waitForReady: false });
    await waitForExist('css-url-paths.hydrated');

    const el = root.querySelector('#absolute')!;
    let imagePath = window.getComputedStyle(el).getPropertyValue('background-image');
    imagePath = imagePath.replace(/"/g, '');
    imagePath = imagePath.replace(/'/g, '');
    expect(imagePath).toBe(`url(https://www.google.com/favicon.ico)`);
  });
});
