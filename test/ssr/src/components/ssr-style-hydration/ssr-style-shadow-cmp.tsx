import { Component } from '@stencil/core';

@Component({
  tag: 'ssr-style-shadow-cmp',
  encapsulation: { type: 'shadow' },
  styles: `
    :host {
      --ssr-style-shadow: 1;
      display: block;
    }
    p {
      font-weight: 700;
    }
  `,
})
export class SsrStyleShadowCmp {
  render() {
    return <p>shadow</p>;
  }
}
