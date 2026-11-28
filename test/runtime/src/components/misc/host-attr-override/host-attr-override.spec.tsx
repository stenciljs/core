import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('host attribute overrides', () => {
  it('should merge class set in HTML with that on the Host', async () => {
    const { root } = await render(<host-attr-override class='override' />, { waitForReady: false });
    await waitForExist('host-attr-override.hydrated');
    expect(root.classList.contains('default')).toBe(true);
    expect(root.classList.contains('override')).toBe(true);
  });

  it('should override non-class attributes', async () => {
    const { root } = await render(<host-attr-override class='with-role' role='another-role' />, {
      waitForReady: false,
    });
    await waitForExist('host-attr-override.hydrated');
    expect(root).toHaveAttribute('role', 'another-role');
  });
});
