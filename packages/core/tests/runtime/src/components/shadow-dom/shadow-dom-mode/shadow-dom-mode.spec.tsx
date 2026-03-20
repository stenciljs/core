import { render, h, describe, it, expect } from '@stencil/vitest';

describe('shadow-dom-mode', () => {
  it('renders with blue mode', async () => {
    await render(<shadow-dom-mode id="blue" colormode="blue"></shadow-dom-mode>);

    const blueElm = document.querySelector('shadow-dom-mode[id="blue"]')!;
    expect(window.getComputedStyle(blueElm).backgroundColor).toBe('rgb(0, 0, 255)');
  });

  it('renders with red mode', async () => {
    await render(<shadow-dom-mode id="red" colormode="red"></shadow-dom-mode>);

    const redElm = document.querySelector('shadow-dom-mode[id="red"]')!;
    expect(window.getComputedStyle(redElm).backgroundColor).toBe('rgb(255, 0, 0)');
  });
});
