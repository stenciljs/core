import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

import { defineCustomElement } from '../test-components/custom-elements-delegates-focus.js';
import { defineCustomElement as defineCustomElementNoFocus } from '../test-components/custom-elements-no-delegates-focus.js';

describe('custom-elements-delegates-focus', () => {
  before(() => {
    render({
      template: () => (
        <>
          <custom-elements-delegates-focus></custom-elements-delegates-focus>
          <custom-elements-no-delegates-focus></custom-elements-no-delegates-focus>
        </>
      ),
    });
  });

  it('should have custom elements not to be defined', () => {
    expect(customElements.get('custom-elements-delegates-focus')).toBeUndefined();
    expect(customElements.get('custom-elements-no-delegates-focus')).toBeUndefined();
  });

  describe('component tests', () => {
    before(() => {
      defineCustomElement();
      defineCustomElementNoFocus();
    });

    it('sets delegatesFocus correctly', () => {
      expect(customElements.get('custom-elements-delegates-focus')).toBeDefined();
      const elm: Element = document.querySelector('custom-elements-delegates-focus');
      expect(elm.shadowRoot).toBeDefined();
      expect(elm.shadowRoot.delegatesFocus).toBe(true);
    });

    it('does not set delegatesFocus when shadow is set to "true"', () => {
      expect(customElements.get('custom-elements-no-delegates-focus')).toBeDefined();
      const elm: Element = document.querySelector('custom-elements-no-delegates-focus');
      expect(elm.shadowRoot).toBeDefined();
      expect(elm.shadowRoot.delegatesFocus).toBe(false);
    });
  });
});
