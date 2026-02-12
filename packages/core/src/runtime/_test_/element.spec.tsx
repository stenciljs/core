import { Component, Element, Method } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('element', () => {
  it('allows the class to be set', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Element() el: HTMLElement;

      @Method()
      setClassNow() {
        this.el.classList.add('new-class');
      }
    }
    // @ts-ignore
    const page = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(page.root).toEqualHtml(`
      <cmp-a></cmp-a>
    `);

    await page.root.setClassNow();
    await page.waitForChanges();

    expect(page.root).toEqualHtml(`
      <cmp-a class="new-class"></cmp-a>
    `);
  });
});
