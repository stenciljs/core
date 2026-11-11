import { Component, h } from '@stencil/core';

@Component({
  tag: 'ssr-style-light-cmp',
  styles: `
    ssr-style-light-cmp {
      --ssr-style-light: 1;
      display: block;
      color: rgb(0, 128, 0);
    }
  `,
})
export class SsrStyleLightCmp {
  render() {
    return <p>light</p>;
  }
}
