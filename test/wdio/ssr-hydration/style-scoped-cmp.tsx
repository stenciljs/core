import { Component, h } from '@stencil/core';

@Component({
  tag: 'ssr-style-scoped-cmp',
  scoped: true,
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
