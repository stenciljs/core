import { render, h, describe, it, expect } from '@stencil/vitest';

describe('scoped-basic', () => {
  it('render', async () => {
    const { root } = await render(<scoped-basic-root colormode='md' />);

    // Check root has scoped host class and hydrated
    expect(root.classList.toString()).toContain('sc-scoped-basic-root-md-h');
    expect(root.classList.toString()).toContain('hydrated');

    const scopedEl = root.querySelector('scoped-basic')!;

    // scoped-basic should have the parent's scoped class + its own host class
    expect(scopedEl.classList.toString()).toContain('sc-scoped-basic-root-md');
    expect(scopedEl.classList.toString()).toContain('sc-scoped-basic-h');
    expect(scopedEl.classList.toString()).toContain('hydrated');

    expect(getComputedStyle(scopedEl).backgroundColor).toBe('rgb(0, 0, 0)');
    expect(getComputedStyle(scopedEl).color).toBe('rgb(128, 128, 128)');

    const scopedSpan = scopedEl.querySelector('span')!;
    // span inside scoped-basic should have scoped-basic's class
    expect(scopedSpan.classList.toString()).toContain('sc-scoped-basic');
    expect(getComputedStyle(scopedSpan).color).toBe('rgb(255, 0, 0)');

    const scopedP = scopedEl.querySelector('p')!;
    // p element should have scoped class and slot class
    expect(scopedP.classList.toString()).toContain('sc-scoped-basic');
    expect(scopedP.classList.toString()).toContain('sc-scoped-basic-s');

    const slottedSpan = scopedEl.querySelector('p span')!;
    // slotted span should have the parent root's scoped class
    expect(slottedSpan.classList.toString()).toContain('sc-scoped-basic-root-md');
    expect(slottedSpan).toHaveTextContent('light');
    expect(getComputedStyle(slottedSpan).color).toBe('rgb(255, 255, 0)');
  });
});
