import { browser } from '@wdio/globals';

import { renderToString } from '../hydrate/index.mjs';
import { setupIFrameTest } from '../util.js';

/**
 * Reproduction of #6934: content a light-DOM component renders into another
 * light-DOM component's default slot must not be hidden after client
 * hydration. When the wrapper hydrates before its owner, the SSR `s-sn`
 * attribute on the projected node is not yet an `s-sn` property, so the slot
 * collection skipped the node and the "no matching slot" hiding logic turned
 * it invisible.
 */
describe('SSR > Client hydration of light-DOM slot projection', () => {
  it("keeps content rendered into another component's default slot visible", async () => {
    // an iframe, so no other test has defined the components yet and we can
    // control the hydration order: the wrapper hydrates first, exactly the
    // order that exposed the regression
    await setupIFrameTest('/ssr-hydration/light-slot-custom-element.html', 'light-slot-custom-elements');
    const frameEle: HTMLIFrameElement = document.querySelector('iframe#light-slot-custom-elements');
    const doc = frameEle.contentDocument;

    const { html } = await renderToString(`<ssr-light-slot-page-cmp></ssr-light-slot-page-cmp>`, {
      fullDocument: true,
      serializeShadowRoot: 'declarative-shadow-dom',
      clientHydrateAnnotations: true,
      constrainTimeouts: false,
      prettyHTML: false,
    });

    const stage = doc.createElement('div');
    stage.setAttribute('id', 'stage');
    stage.setHTMLUnsafe(html);
    doc.body.appendChild(stage);

    const script = doc.createElement('script');
    script.type = 'module';
    script.textContent = `
      import { defineCustomElement as defineWrap } from '/test-components/ssr-light-slot-wrap-cmp.js';
      import { defineCustomElement as definePage } from '/test-components/ssr-light-slot-page-cmp.js';
      defineWrap();
      definePage();
    `;
    doc.body.appendChild(script);

    await browser.waitUntil(
      async () =>
        !!(
          frameEle.contentWindow.customElements.get('ssr-light-slot-wrap-cmp') &&
          frameEle.contentWindow.customElements.get('ssr-light-slot-page-cmp')
        ),
    );

    const projectedDiv = doc.querySelector('div.inner-projected') as HTMLElement;
    await browser.waitUntil(async () => !!projectedDiv);

    const wrapper = doc.querySelector('ssr-light-slot-wrap-cmp');
    await browser.waitUntil(async () => wrapper.classList.contains('hydrated'));
    await browser.pause(200);

    expect(projectedDiv.hidden).toBe(false);

    stage.remove();
  });
});
