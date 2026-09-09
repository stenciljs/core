import { render, h, describe, it, expect } from '@stencil/vitest';
import { userEvent } from 'vitest/browser';

describe('input-basic', () => {
  it('should change value prop both ways', async () => {
    const { root, waitForChanges } = await render(<input-basic-root value='hello' />);

    const input = root.querySelector('input')!;
    expect(input.value).toBe('hello');

    // Clear and type new value
    await userEvent.clear(input);
    await userEvent.type(input, 'bye');
    await waitForChanges();
    expect(input.value).toBe('bye');

    // Set value via property
    const cmp = root as HTMLInputBasicRootElement;
    cmp.value = 'value';
    await waitForChanges();
    expect(input.value).toBe('value');
  });
});
