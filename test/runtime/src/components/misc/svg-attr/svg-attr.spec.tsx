import { render, h, describe, it, expect } from '@stencil/vitest';

describe('svg attr', () => {
  it('adds and removes attribute', async () => {
    const { root, waitForChanges } = await render(<svg-attr />);

    const rect = root.querySelector('rect')!;
    expect(rect.hasAttribute('transform')).toBe(false);

    root.querySelector('button')!.click();
    await waitForChanges();

    const rect2 = root.querySelector('rect')!;
    expect(rect2.getAttribute('transform')).toBe('rotate(45 27 27)');

    root.querySelector('button')!.click();
    await waitForChanges();

    const rect3 = root.querySelector('rect')!;
    expect(rect3.hasAttribute('transform')).toBe(false);
  });
});
