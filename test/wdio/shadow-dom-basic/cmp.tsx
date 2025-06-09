import { Component, h } from '@stencil/core';

@Component({
  tag: 'shadow-dom-basic',
  styles: `
    div {
      background: rgb(0, 0, 0);
      color: white;
    }
  `,
  shadow: true,
})
export class ShadowDomBasic {
  render() {
    return [<div>shadow</div>, <slot />];
  }
}
