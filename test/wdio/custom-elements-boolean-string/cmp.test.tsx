import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

import { defineCustomElement } from '../test-components/custom-elements-boolean-string.js';

type BooleanStringElement = HTMLElement & { bool: boolean; union: boolean | string };

describe('custom-elements-boolean-string', () => {
  before(() => {
    render({
      template: () => (
        <div>
          <custom-elements-boolean-string id="preset" bool="" union="" />
          <custom-elements-boolean-string id="set-later" />
        </div>
      ),
    });
    defineCustomElement();
  });

  it('sets boolean and boolean|string props from empty attributes (#6963)', async () => {
    const element = document.querySelector('#preset') as BooleanStringElement;

    await browser.waitUntil(() => element.bool === true);

    expect(element.bool).toBe(true);
    expect(element.union).toBe('');
  });

  it('sets a boolean|string prop when an empty attribute is added later', async () => {
    const element = document.querySelector('#set-later') as BooleanStringElement;
    expect(element.union).toBe(false);

    element.setAttribute('union', '');

    expect(element.union).toBe('');
  });
});
