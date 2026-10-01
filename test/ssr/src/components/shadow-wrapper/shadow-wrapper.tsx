import { Component, Host } from '@stencil/core';

@Component({
  tag: 'shadow-wrapper',
  encapsulation: { type: 'shadow' },
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
