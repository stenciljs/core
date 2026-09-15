import { render, h } from '@stencil/vitest';
import { describe, it, expect } from 'vitest';

describe('image-import', () => {
  it('should import SVG as base64 data URL', async () => {
    const { root } = await render(<image-import />);

    const img = root.querySelector('img');
    expect(img).toBeTruthy();

    const src = img!.getAttribute('src');
    // SVG should be inlined as base64 data URL
    expect(src!.startsWith('data:image/svg+xml;base64,PD94bW')).toBe(true);
  });
});
