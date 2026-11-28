import { render, h, waitForExist, expect, it, describe } from '@stencil/vitest';

describe('global-styles', () => {
  it('should have global styles applied', async () => {
    const { root } = await render(<global-styles />);
    await waitForExist('global-styles.hydrated');

    const computedStyle = window.getComputedStyle(root);
    expect(computedStyle.border).toBe('5px dotted rgb(255, 0, 0)');
  });
});
