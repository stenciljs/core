import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'shadow-ssr-parent-cmp',
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
          <scoped-ssr-child-cmp>
            <slot name="things" />
          </scoped-ssr-child-cmp>
          <div>
            <slot />
          </div>
        </div>
      </Host>
    );
  }
}
