import { Fragment, render, h, describe, it, expect } from '@stencil/vitest';

describe('host attribute overrides', () => {
  it('should merge class set in HTML with that on the Host', async () => {
    const { root } = await render(<host-attr-override class="override" />);
    expect(root.classList.contains('default')).toBe(true);
    expect(root.classList.contains('override')).toBe(true);
  });

  it('should override non-class attributes', async () => {
    const { root } = await render(<host-attr-override class="with-role" role="another-role" />);
    expect(root).toHaveAttribute('role', 'another-role');
  });
});
