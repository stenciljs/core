import { Component, h } from '@stencil/core';

/**
 * Shadow DOM component to test global style injection.
 * When `inject: 'client'` is set on a global-style output, the CSS should be
 * adopted into this component's shadow DOM as a constructable stylesheet.
 */
@Component({
  tag: 'injected-style-cmp',
  encapsulation: { type: 'shadow' },
})
export class InjectedStyleCmp {
  render() {
    return (
      <div class='injected-test'>
        <p>Injected Style Component</p>
        <span class='u-hidden'>This should be hidden if inject works</span>
        <span class='u-flex'>This should be flex if inject works</span>
      </div>
    );
  }
}
