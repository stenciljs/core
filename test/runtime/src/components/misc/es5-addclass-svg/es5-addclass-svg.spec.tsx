import { render, h, describe, it, expect } from '@stencil/vitest';

describe('es5 $addClass svg', () => {
  it('should add a class', async () => {
    const { root } = await render(<es5-addclass-svg />);

    const svg = root.shadowRoot!.querySelector('svg')!;
    expect(svg.getAttribute('class')).toContain('existing-css-class');
    expect(svg.getAttribute('class')).not.toContain('sc-es5-addclass-svg');
  });
});
