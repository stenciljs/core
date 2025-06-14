import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'ssr-order-wrap-cmp',
  shadow: true,
  styles: `
    :host {
      display: block;
      border: 3px solid blue;
    }
  `,
})
export class MyApp {
  render() {
    return (
      <Host>
        <div>
          <ssr-order-cmp>
            <slot name="things" />
            <div class="AFTER">after</div>
          </ssr-order-cmp>
          <div>
            <slot />
          </div>
        </div>
      </Host>
    );
  }
}
