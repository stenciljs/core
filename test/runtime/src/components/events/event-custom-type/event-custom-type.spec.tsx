import { render, h, describe, it, expect } from '@stencil/vitest';

describe('event-custom-type', () => {
  it('should dispatch an event on load', async () => {
    const { root } = await render(<event-custom-type />);
    expect(root.querySelector('#counter')).toHaveTextContent('1');
  });

  it('should emit a complex type', async () => {
    const { root } = await render(<event-custom-type />);
    expect(root.querySelector('#lastValue')).toHaveTextContent('{"value":"Test value"}');
  });
});
