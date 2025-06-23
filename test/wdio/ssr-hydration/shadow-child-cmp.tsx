import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'shadow-ssr-child-cmp',
  scoped: true,
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
          <slot />
        </div>
      </Host>
    );
  }
}
