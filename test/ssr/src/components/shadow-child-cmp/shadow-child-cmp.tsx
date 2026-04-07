import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'shadow-ssr-child-cmp',
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
        <div>
          Shadow Child 1.
          <ssr-order-cmp>
            <slot />
          </ssr-order-cmp>
        </div>
      </Host>
    );
  }
}
