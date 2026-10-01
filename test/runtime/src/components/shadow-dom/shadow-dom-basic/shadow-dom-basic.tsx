import { Component } from '@stencil/core';

@Component({
  tag: 'shadow-dom-basic',
  styles: `
    div {
      background: rgb(0, 0, 0);
      color: white;
    }
  `,
  encapsulation: { type: 'shadow' },
})
export class ShadowDomBasic {
  render() {
    return [<div>shadow</div>, <slot />];
  }
}
