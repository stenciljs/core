import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('reflect-to-attr', () => {
  it('should have proper attributes', async () => {
    const { root, waitForChanges } = await render(<reflect-to-attr />);

    const cmp = root as HTMLReflectToAttrElement;

    expect(cmp.getAttribute('str')).toBe('single');
    expect(cmp.getAttribute('nu')).toBe('2');
    expect(cmp.getAttribute('undef')).toBe(null);
    expect(cmp.getAttribute('null')).toBe(null);
    expect(cmp.getAttribute('bool')).toBe(null);
    expect(cmp.getAttribute('other-bool')).toBe('');

    cmp.str = 'second';
    cmp.nu = -12.2;
    cmp.undef = 'no undef';
    cmp.null = 'no null';
    cmp.bool = true;
    cmp.otherBool = false;

    await waitForChanges();

    expect(cmp.getAttribute('str')).toBe('second');
    expect(cmp.getAttribute('nu')).toBe('-12.2');
    expect(cmp.getAttribute('undef')).toBe('no undef');
    expect(cmp.getAttribute('null')).toBe('no null');
    expect(cmp.getAttribute('bool')).toBe('');
    expect(cmp.getAttribute('other-bool')).toBe(null);

    expect(cmp.getAttribute('dynamic-str')).toBe('value');
    expect(cmp.getAttribute('dynamic-nu')).toBe('123');
  });

  it('should reflect booleans property', async () => {
    const { root, waitForChanges } = await render(<reflect-to-attr />);

    const cmp = root as HTMLReflectToAttrElement;
    expect(cmp.disabled).toBe(false);

    cmp.disabled = true;
    await waitForChanges();
    expect(cmp.disabled).toBe(true);

    cmp.disabled = false;
    await waitForChanges();
    expect(cmp.disabled).toBe(false);
  });
});
