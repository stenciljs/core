import { render, h, describe, it, expect } from '@stencil/vitest';

describe('build-data', () => {
  it('should have proper values', async () => {
    const { root } = await render(<build-data />);

      expect(['isDev: false', 'isDev: true']).toContain(root.querySelector('.is-dev')?.textContent);
      expect(root.querySelector('.is-browser')).toHaveTextContent('isBrowser: true');
    expect(root.querySelector('.is-testing')).toHaveTextContent('isTesting: false');
  });
});
