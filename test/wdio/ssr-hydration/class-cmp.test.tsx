import { browser } from '@wdio/globals';

import { renderToString } from '../hydrate/index.mjs';
import { setupIFrameTest } from '../util.js';

describe('SSR > Client hydration of child component host classes', () => {
  it('keeps the classes a child sets on its own host when it hydrates before its parent', async () => {
    // an iframe, so no other test has defined the components through the lazy loader
    await setupIFrameTest('/ssr-hydration/class-custom-element.html', 'class-custom-elements');
    const frameEle: HTMLIFrameElement = document.querySelector('iframe#class-custom-elements');
    const doc = frameEle.contentDocument;

    const { html } = await renderToString(`<ssr-class-parent-cmp></ssr-class-parent-cmp>`, {
      fullDocument: true,
      serializeShadowRoot: 'declarative-shadow-dom',
    });
    const stage = doc.createElement('div');
    stage.setAttribute('id', 'stage');
    stage.setHTMLUnsafe(html);
    doc.body.appendChild(stage);

    // define the child first, so it hydrates and renders before its parent
    const script = doc.createElement('script');
    script.type = 'module';
    script.textContent = `
      import { defineCustomElement as defineChild } from '/test-components/ssr-class-child-cmp.js';
      import { defineCustomElement as defineParent } from '/test-components/ssr-class-parent-cmp.js';
      defineChild();
      defineParent();
    `;
    doc.head.appendChild(script);

    const parent = doc.querySelector('ssr-class-parent-cmp');
    await browser.waitUntil(async () => !!frameEle.contentWindow.customElements.get('ssr-class-parent-cmp'));
    await browser.pause(100);

    const withClass = parent.shadowRoot.querySelector('#with-class');
    const withoutClass = parent.shadowRoot.querySelector('#without-class');
    await expect(Array.from(withClass.classList).sort()).toEqual([
      'child-disabled',
      'child-own',
      'hydrated',
      'parent-set',
    ]);
    await expect(Array.from(withoutClass.classList).sort()).toEqual(['child-disabled', 'child-own', 'hydrated']);
  });
});
