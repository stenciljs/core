import { render, h, describe, it, expect, waitForStable } from '@stencil/vitest';

describe('svg class', () => {
  it('toggles svg class', async () => {
    const { root, waitForChanges } = await render(<svg-class />);

    const svg = root.querySelector('svg')!;
    const circle = root.querySelector('circle')!;
    const rect = root.querySelector('rect')!;

    expect(svg.classList.contains('primary')).toBe(false);
    expect(circle.classList.contains('red')).toBe(false);
    expect(rect.classList.contains('blue')).toBe(false);

    root.querySelector('button')!.click();
    await waitForChanges();

    expect(svg.classList.contains('primary')).toBe(true);
    expect(circle.classList.contains('red')).toBe(true);
    expect(rect.classList.contains('blue')).toBe(true);
  });
});
