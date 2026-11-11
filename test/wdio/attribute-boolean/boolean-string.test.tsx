import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

type BooleanStringElement = HTMLElement & {
  union: boolean | string;
  componentOnReady(): Promise<unknown>;
};

describe('attribute-boolean-string', () => {
  before(() => {
    render({
      template: () => <custom-elements-boolean-string />,
    });
  });

  it('sets a boolean|string prop when an empty attribute is added after load', async () => {
    const element = document.querySelector('custom-elements-boolean-string') as BooleanStringElement;
    await element.componentOnReady();
    expect(element.union).toBe(false);

    element.setAttribute('union', '');

    expect(element.union).toBe('');
  });
});
