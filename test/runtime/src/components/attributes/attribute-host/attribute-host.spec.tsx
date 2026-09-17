import { render, h, describe, it, expect } from '@stencil/vitest';

describe('attribute-host', () => {
  it('add/remove attrs', async () => {
    const { root, waitForChanges } = await render(<attribute-host />);

    const section = root.querySelector('section')!;
    const button = root.querySelector('button')!;

    // Initial state - attributes removed
    expect(section).toHaveAttribute('content', 'attributes removed');
    expect(section).toHaveAttribute('bold', 'false');
    expect(section).not.toHaveAttribute('padding');
    expect(section).not.toHaveAttribute('margin');
    expect(section).not.toHaveAttribute('color');
    expect(section).not.toHaveAttribute('no-attr');

    const defaultBorderColor = getComputedStyle(document.body).borderColor.replaceAll(' ', '');
    expect(getComputedStyle(section).borderColor.replaceAll(' ', '')).toBe(defaultBorderColor);
    expect(getComputedStyle(section).display).toBe('inline-block');
    expect(getComputedStyle(section).fontSize).toBe('16px');

    // CSS custom properties
    expect(section.style.getPropertyValue('--css-var')).toBe('');

    // Click to add attributes
    button.click();
    await waitForChanges();

    expect(getComputedStyle(section).borderColor.replaceAll(' ', '')).toBe('rgb(0,0,0)');
    expect(getComputedStyle(section).display).toBe('block');
    expect(getComputedStyle(section).fontSize).toBe('24px');

    expect(section.style.getPropertyValue('--css-var')).toBe('12');

    expect(section).toHaveAttribute('content', 'attributes added');
    expect(section).toHaveAttribute('padding', '');
    expect(section).toHaveAttribute('bold', 'true');
    expect(section).toHaveAttribute('margin', '');
    expect(section).toHaveAttribute('color', 'lime');
    expect(section).not.toHaveAttribute('no-attr');

    // Click to remove attributes
    button.click();
    await waitForChanges();

    expect(getComputedStyle(section).borderColor.replaceAll(' ', '')).toBe(defaultBorderColor);
    expect(getComputedStyle(section).display).toBe('inline-block');
    expect(getComputedStyle(section).fontSize).toBe('16px');

    expect(section.style.getPropertyValue('--css-var')).toBe('');

    expect(section).toHaveAttribute('content', 'attributes removed');
    expect(section).not.toHaveAttribute('padding');
    expect(section).toHaveAttribute('bold', 'false');
    expect(section).not.toHaveAttribute('margin');
    expect(section).not.toHaveAttribute('color');
    expect(section).not.toHaveAttribute('no-attr');

    // Click to add attributes again
    button.click();
    await waitForChanges();

    expect(getComputedStyle(section).borderColor.replaceAll(' ', '')).toBe('rgb(0,0,0)');
    expect(getComputedStyle(section).display).toBe('block');
    expect(getComputedStyle(section).fontSize).toBe('24px');

    expect(section.style.getPropertyValue('--css-var')).toBe('12');

    expect(section).toHaveAttribute('content', 'attributes added');
    expect(section).toHaveAttribute('padding', '');
    expect(section).toHaveAttribute('bold', 'true');
    expect(section).toHaveAttribute('margin', '');
    expect(section).toHaveAttribute('color', 'lime');
    expect(section).not.toHaveAttribute('no-attr');
  });
});
