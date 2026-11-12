import { Component, Host } from '@stencil/core';

@Component({
  tag: 'ssr-order-cmp',
  encapsulation: { type: 'shadow' },
  styles: `
    :host {
      display: block;
      border: 3px solid red;
    }
  `,
})
export class MyApp {
  render() {
    return (
      <Host>
        Order component. Shadow.
        <slot />
      </Host>
    );
  }
}
