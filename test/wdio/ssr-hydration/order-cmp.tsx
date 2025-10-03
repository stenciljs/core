import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'ssr-order-cmp',
  shadow: true,
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
