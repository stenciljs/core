import { render, h, describe, it, expect } from '@stencil/vitest';

describe('shadow-dom-basic', () => {
  it('render', async () => {
    const { root } = await render(<shadow-dom-basic-root />);

    expect(root.shadowRoot).toBeDefined();

    const shadowDomBasic = root.shadowRoot!.lastElementChild as HTMLShadowDomBasicElement;
    const lightDiv = shadowDomBasic.children[0];

    expect(lightDiv.nodeName).toBe('DIV');
    expect(lightDiv.textContent!.trim()).toBe('light');

    expect(shadowDomBasic.nodeName).toBe('SHADOW-DOM-BASIC');
    const shadowDiv = shadowDomBasic.shadowRoot!.lastElementChild!.previousElementSibling!;
    expect(shadowDiv.nodeName).toBe('DIV');
    expect(shadowDiv.textContent!.trim()).toBe('shadow');

    const shadowBG = window.getComputedStyle(shadowDiv).backgroundColor;
    expect(shadowBG).toBe('rgb(0, 0, 0)');

    const lightBG = window.getComputedStyle(shadowDomBasic.lastElementChild!).backgroundColor;
    expect(lightBG).toBe('rgb(255, 255, 0)');
  });
});
