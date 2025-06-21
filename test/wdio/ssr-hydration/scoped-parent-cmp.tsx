import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'scoped-ssr-parent-cmp',
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
          <shadow-ssr-child-cmp>
            <slot name="things" />
          </shadow-ssr-child-cmp>
          <div>
            <slot />
          </div>
        </div>
      </Host>
    );
  }
}
