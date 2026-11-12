import { Component } from '@stencil/core';

@Component({
  tag: 'ssr-style-scoped-cmp',
  encapsulation: { type: 'scoped' },
  styles: `
    :host {
      --ssr-style-scoped: 1;
      display: block;
    }
  `,
})
export class SsrStyleScopedCmp {
  render() {
    return <p>scoped</p>;
  }
}
