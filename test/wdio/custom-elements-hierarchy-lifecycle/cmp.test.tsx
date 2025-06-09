import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

import { defineCustomElement as defineCustomElementChildCmp } from '../test-components/custom-elements-hierarchy-lifecycle-child.js';
import { defineCustomElement as defineCustomElementParentCmp } from '../test-components/custom-elements-hierarchy-lifecycle-parent.js';

describe('custom-elements-hierarchy-lifecycle', () => {
  before(() => {
    defineCustomElementChildCmp();
    defineCustomElementParentCmp();
  });

  it('should call componentDidLoad in the child before the parent', async () => {
    expect(customElements.get('custom-elements-hierarchy-lifecycle-child')).toBeDefined();
    expect(customElements.get('custom-elements-hierarchy-lifecycle-parent')).toBeDefined();

    render({
      template: () => (
        <>
          <custom-elements-hierarchy-lifecycle-parent></custom-elements-hierarchy-lifecycle-parent>
        </>
      ),
    });

    const elm = document.querySelector('custom-elements-hierarchy-lifecycle-parent');
    expect(elm.shadowRoot).toBeDefined();

    await browser.waitUntil(() => Boolean(elm.shadowRoot.querySelector('custom-elements-hierarchy-lifecycle-child')));

    expect(Array.from(document.querySelectorAll('p')).map((r) => r.textContent)).toEqual([
      'DID LOAD CHILD',
      'DID LOAD PARENT',
    ]);
  });
});
