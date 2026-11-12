import { render, h, describe, it, expect } from '@stencil/vitest';

// Verify attr: prefix in JSX correctly passes values as attributes to nested component

describe('prefix-attr', () => {
  it('should pass values from parent to nested component using attr: prefix', async () => {
    const { root } = await render(<prefix-attr-root />);

    const nested = root.querySelector('prefix-attr-nested')!;
    expect(nested).toHaveAttribute('message', 'Hello');
    expect(nested).toHaveAttribute('count', '42');
    expect(nested).toHaveAttribute('enabled');
    expect(nested).toHaveAttribute('null-value', 'not-null');
    expect(nested).toHaveAttribute('undefined-value', 'defined');
  });

  it('should update nested component when parent state changes', async () => {
    const { root, waitForChanges } = await render(<prefix-attr-root />);

    const nested = root.querySelector('prefix-attr-nested')!;

    const updateBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent === 'Update Message',
    )!;
    updateBtn.click();
    await waitForChanges();
    expect(nested).toHaveAttribute('message', 'Updated');

    const countBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent === 'Update Count',
    )!;
    countBtn.click();
    await waitForChanges();
    expect(nested).toHaveAttribute('count', '99');

    const disableBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent === 'Disable',
    )!;
    disableBtn.click();
    await waitForChanges();
    expect(nested).not.toHaveAttribute('enabled');

    const setNullBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent === 'Set Null to String',
    )!;
    setNullBtn.click();
    await waitForChanges();
    expect(nested).not.toHaveAttribute('null-value');

    const setUndefinedBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent === 'Set Undefined to String',
    )!;
    setUndefinedBtn.click();
    await waitForChanges();
    expect(nested).not.toHaveAttribute('undefined-value');
  });
});
