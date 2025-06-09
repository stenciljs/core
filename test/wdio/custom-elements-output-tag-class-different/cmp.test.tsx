import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

import { defineCustomElement } from '../test-components/custom-element-child-different-name-than-class.js';
import { defineCustomElement as defineCustomElementRoot } from '../test-components/custom-element-root-different-name-than-class.js';

describe('custom-elements-output-tag-class-different', () => {
  before(() => {
    render({
      template: () => (
        <>
          <custom-element-root-different-name-than-class></custom-element-root-different-name-than-class>
        </>
      ),
    });
  });

  it('should have custom elements not to be defined', () => {
    expect(customElements.get('custom-element-root-different-name-than-class')).toBeUndefined();
    expect(customElements.get('custom-element-child-different-name-than-class')).toBeUndefined();
  });

  it('defines components and their dependencies', async () => {
    defineCustomElement();
    defineCustomElementRoot();
    expect(customElements.get('custom-element-root-different-name-than-class')).toBeDefined();

    const elm = document.querySelector('custom-element-root-different-name-than-class');
    expect(elm.shadowRoot).toBeDefined();

    const selector = 'custom-element-child-different-name-than-class';
    await browser.waitUntil(() => Boolean(elm.shadowRoot.querySelector(selector)));
    const childElm = elm.shadowRoot.querySelector(selector);
    expect(childElm.shadowRoot).toBeDefined();
  });
});
