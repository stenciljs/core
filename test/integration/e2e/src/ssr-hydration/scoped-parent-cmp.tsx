import { Component, Host } from '@stencil/core';

@Component({
  tag: 'scoped-ssr-parent-cmp',
  encapsulation: { type: 'scoped' },
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
          Scoped parent with named slot.
          <shadow-ssr-child-cmp>
            <slot />
            <slot name='things' />
          </shadow-ssr-child-cmp>
        </div>
      </Host>
    );
  }
}
