import { Component, h } from '@stencil/core';

@Component({
  tag: 'ssr-style-shadow-cmp',
  shadow: true,
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
