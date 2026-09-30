import { browser } from '@wdio/globals';

import { renderToString } from '../hydrate/index.mjs';
import { setupIFrameTest } from '../util.js';

describe('SSR > Client hydration host classes', () => {
  it('keeps the host classes of a child component that renders before its parent', async () => {
    await setupIFrameTest('/ssr-hydration/host-class.html', 'host-class-custom-elements');
    const frameEle: HTMLIFrameElement = document.querySelector('iframe#host-class-custom-elements');
    const doc = frameEle.contentDocument;

    const { html } = await renderToString(`<ssr-host-class-parent></ssr-host-class-parent>`, {
      fullDocument: true,
      serializeShadowRoot: 'declarative-shadow-dom',
      prettyHTML: false,
    });
    const stage = doc.createElement('div');
    stage.setAttribute('id', 'stage');
    stage.setHTMLUnsafe(html);
    doc.body.appendChild(stage);

    await browser.waitUntil(async () => typeof (frameEle.contentWindow as any).defineHostClassCmps === 'function');
    (frameEle.contentWindow as any).defineHostClassCmps();

    const parent = doc.querySelector('ssr-host-class-parent');
    await browser.waitUntil(async () => parent.classList.contains('hydrated'));
    await browser.pause(100);

    const classesOf = (id: string) => [...parent.shadowRoot.querySelector(`#${id}`).classList].sort().join(' ');
    expect(classesOf('with-class')).toBe('child-disabled child-own hydrated parent-set');
    expect(classesOf('without-class')).toBe('child-disabled child-own hydrated');
  });
});
