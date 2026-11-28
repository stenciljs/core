import { Component, Host } from '@stencil/core';

@Component({
  tag: 'csp-nonce-cmp',
  encapsulation: { type: 'scoped' },
  styles: `
    :host {
      color: rgb(255, 0, 0);
    }
  `,
})
export class CspNonceCmp {
  render() {
    return <Host>csp nonce test</Host>;
  }
}
