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

  it('should not overwrite a reflected any-typed prop with its own reflected attribute', async () => {
    const { root, waitForChanges } = await render(<reflect-to-attr />);

    const cmp = root as HTMLReflectToAttrElement;

    // reflecting `true` writes the empty attribute and `false` removes it. Neither may be
    // assigned back onto the prop, since an `any` prop isn't coerced.
    cmp.anyVal = true;
    await waitForChanges();
    expect(cmp.getAttribute('any-val')).toBe('');
    expect(cmp.anyVal).toBe(true);

    cmp.anyVal = false;
    await waitForChanges();
    expect(cmp.hasAttribute('any-val')).toBe(false);
    expect(cmp.anyVal).toBe(false);

    cmp.anyVal = 0;
    await waitForChanges();
    expect(cmp.getAttribute('any-val')).toBe('0');
    expect(cmp.anyVal).toBe(0);

    // an external attribute write still wins
    cmp.setAttribute('any-val', 'external');
    await waitForChanges();
    expect(cmp.anyVal).toBe('external');
  });
});
