import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

const CSS = `main {
  color: blue;
  font-weight: bold;
}`;

describe('shadow-dom-slot-nested', () => {
  beforeEach(async () => {
    render({
      components: [],
      template: () => (
        <>
          <main>
            main content
            <shadow-dom-slot-nested-root></shadow-dom-slot-nested-root>
          </main>
          <style>{CSS}</style>
        </>
      ),
    });
  });

  it('renders children', async () => {
    const elm = $('main');
    const {
      parsed: { hex: hexMain },
    } = await elm.getCSSProperty('color');
    expect(hexMain).toBe('#0000ff');

    const cmp = $('shadow-dom-slot-nested-root');
    const section = cmp.shadow$('section');
    const {
      parsed: { hex: hexSection },
    } = await section.getCSSProperty('color');
    expect(hexSection).toBe('#008000');

    const article = cmp.shadow$('article');
    const {
      parsed: { hex: hexArticle },
    } = await article.getCSSProperty('color');
    expect(hexArticle).toBe('#008000');

    const children = cmp.$$('article > shadow-dom-slot-nested');
    await expect(children).toBeElementsArrayOfSize(3);

    const testShadowNested = async function (i: number) {
      const nestedElm = children[i];

      const header = nestedElm.shadow$('header');
      await expect(header).toHaveText('shadow dom: ' + i);
      const {
        parsed: { hex: hexHeader },
      } = await header.getCSSProperty('color');
      expect(hexHeader).toBe('#ff0000');

      const footer = nestedElm.shadow$('footer');
      const footerSlot = footer.$('slot');
      await expect(children).toBeElementsArrayOfSize(3);
      await expect(footerSlot.$$('*')).toBeElementsArrayOfSize(0);
      await expect(footerSlot).toHaveText('');

      await expect(nestedElm).toHaveText(expect.stringContaining('light dom: ' + i));
      const {
        parsed: { hex: hexNestedElm },
      } = await nestedElm.getCSSProperty('color');
      expect(hexNestedElm).toBe('#008000');
    };

    await testShadowNested(0);
    await testShadowNested(1);
    await testShadowNested(2);
  });
});
