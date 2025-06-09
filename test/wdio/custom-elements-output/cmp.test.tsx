import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

import { defineCustomElement as defineCustomElementChild } from '../test-components/custom-element-child.js';
import { defineCustomElement as defineCustomElementNestedChild } from '../test-components/custom-element-nested-child.js';
import { defineCustomElement } from '../test-components/custom-element-root.js';

describe('custom-elements-output', () => {
  before(() => {
    render({
      template: () => (
        <>
          <custom-element-root></custom-element-root>
        </>
      ),
    });
  });

  it('should have custom elements not to be defined', () => {
    expect(customElements.get('custom-element-root')).toBeUndefined();
    expect(customElements.get('custom-element-child')).toBeUndefined();
    expect(customElements.get('custom-element-nested-child')).toBeUndefined();
  });

  it('defines components and their dependencies', async () => {
    defineCustomElement();
    defineCustomElementChild();
    defineCustomElementNestedChild();

    expect(customElements.get('custom-element-root')).toBeDefined();
    expect(customElements.get('custom-element-child')).toBeDefined();
    expect(customElements.get('custom-element-nested-child')).toBeDefined();

    const elm = document.querySelector('custom-element-root');
    await browser.waitUntil(() => Boolean(elm.shadowRoot.querySelector('custom-element-child')));
    const childElm = elm.shadowRoot.querySelector('custom-element-child');
    const childNestedElm = childElm.shadowRoot.querySelector('custom-element-nested-child');

    expect(elm.shadowRoot).toBeDefined();
    expect(childElm.shadowRoot).toBeDefined();
    expect(childNestedElm.shadowRoot).toBeDefined();
  });
});
