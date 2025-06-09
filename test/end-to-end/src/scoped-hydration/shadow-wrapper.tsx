import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'shadow-wrapper',
  shadow: true,
  styles: `
    :host {
      display: block;
      border: 3px solid red;
    }
  `,
})
export class Wrapper {
  render() {
    return (
      <Host>
        <strong style={{ color: 'red' }}>Shadow Wrapper Start</strong>
        <p>Shadow Slot before</p>
        <slot>Wrapper Slot Fallback</slot>
        <p>Shadow Slot after</p>
        <strong style={{ color: 'red' }}>Shadow Wrapper End</strong>
      </Host>
    );
  }
}
