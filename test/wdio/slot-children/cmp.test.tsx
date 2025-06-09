import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-children', () => {
  beforeEach(() => {
    render({
      template: () => (
        <slot-children-root>
          LightDomA
          <header>LightDomB</header>
          <main>LightDomC</main>
          <footer>LightDomD</footer>
          LightDomE
        </slot-children-root>
      ),
    });
  });

  it('get shadow child nodes', () => {
    const elm = document.querySelector('slot-children-root');
    expect(elm.childElementCount).toBe(3);
  });
});
