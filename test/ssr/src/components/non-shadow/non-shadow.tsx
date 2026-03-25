import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'non-shadow-child',
  scoped: true,
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
        <br />
        <strong style={{ color: 'blue' }}>Nested Non-Shadow Component Start</strong>
        <br />
        <slot>Slotted fallback content</slot>
        <strong style={{ color: 'blue' }}>Nested Non-Shadow Component End</strong>
      </Host>
    );
  }
}
