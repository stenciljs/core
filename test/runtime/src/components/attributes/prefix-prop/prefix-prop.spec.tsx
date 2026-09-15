import { render, h, describe, it, expect } from '@stencil/vitest';

describe('prefix-prop', () => {
  it('should pass values from parent to nested component using prop: prefix', async () => {
    const { root } = await render(<prefix-prop-root />);

    const nested = root.querySelector('prefix-prop-nested') as HTMLPrefixPropNestedElement;

    expect(nested.message).toBe('Hello');
    expect(nested.count).toBe(42);
    expect(nested.nullValue).toBe(null);
    expect(nested.undefinedValue == null).toBe(true);

    // Verify NO HTML attributes are set
    expect(nested).not.toHaveAttribute('message');
    expect(nested).not.toHaveAttribute('count');
    expect(nested).not.toHaveAttribute('nullValue');
    expect(nested).not.toHaveAttribute('undefinedValue');
  });

  it('should update nested component when parent state changes', async () => {
    const { root, waitForChanges } = await render(<prefix-prop-root />);

    const nested = root.querySelector('prefix-prop-nested') as HTMLPrefixPropNestedElement;

    const updateBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent === 'Update Message',
    )!;
    updateBtn.click();
    await waitForChanges();
    expect(nested.message).toBe('Updated');

    const countBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent === 'Update Count',
    )!;
    countBtn.click();
    await waitForChanges();
    expect(nested.count).toBe(99);

    // Still no attributes
    expect(nested).not.toHaveAttribute('message');
    expect(nested).not.toHaveAttribute('count');
  });

  it('should handle null and undefined values correctly', async () => {
    const { root, waitForChanges } = await render(<prefix-prop-root />);

    const nested = root.querySelector('prefix-prop-nested') as HTMLPrefixPropNestedElement;

    expect(nested.nullValue).toBe(null);
    // undefined becomes null in Stencil
    expect(nested.undefinedValue == null).toBe(true);

    // When set to actual strings, they should update
    const setNullBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent === 'Set Null to String',
    )!;
    setNullBtn.click();
    await waitForChanges();
    expect(nested.nullValue).toBe('not-null');

    const setUndefinedBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent === 'Set Undefined to String',
    )!;
    setUndefinedBtn.click();
    await waitForChanges();
    expect(nested.undefinedValue).toBe('defined');
  });
});
