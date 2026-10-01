import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

const CSS = `main {
  color: blue;
  font-weight: bold;
}`;

describe('shadow-dom-slot-nested', () => {
  it('renders children', async () => {
    // Add style to document
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    await render(
      <main>
        main content
        <shadow-dom-slot-nested-root></shadow-dom-slot-nested-root>
      </main>,
      { waitForReady: false },
    );
    await waitForExist('shadow-dom-slot-nested-root.hydrated');

    const main = document.querySelector('main')!;
    expect(window.getComputedStyle(main).color).toBe('rgb(0, 0, 255)');

    const cmp = document.querySelector('shadow-dom-slot-nested-root')!;
    const shadowRoot = cmp.shadowRoot!;
    const section = shadowRoot.querySelector('section')!;
    expect(window.getComputedStyle(section).color).toBe('rgb(0, 128, 0)');

    const article = shadowRoot.querySelector('article')!;
    expect(window.getComputedStyle(article).color).toBe('rgb(0, 128, 0)');

    const children = article.querySelectorAll('shadow-dom-slot-nested');
    expect(children.length).toBe(3);

    const testShadowNested = (i: number) => {
      const nestedElm = children[i];
      const nestedShadowRoot = nestedElm.shadowRoot!;

      const header = nestedShadowRoot.querySelector('header')!;
      expect(header.textContent).toBe('shadow dom: ' + i);
      expect(window.getComputedStyle(header).color).toBe('rgb(255, 0, 0)');

      const footer = nestedShadowRoot.querySelector('footer')!;
      const footerSlot = footer.querySelector('slot')!;
      expect(footerSlot.assignedElements().length).toBe(0);

      expect(nestedElm.textContent).toContain('light dom: ' + i);
      expect(window.getComputedStyle(nestedElm).color).toBe('rgb(0, 128, 0)');
    };

    testShadowNested(0);
    testShadowNested(1);
    testShadowNested(2);
  });
});
