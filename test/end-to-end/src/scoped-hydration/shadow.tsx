import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'shadow-child',
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
        <br />
        <strong style={{ color: 'blue' }}>Nested Shadow Component Start</strong>
        <br />
        <slot>
          <div>Slotted fallback content</div>
        </slot>
        <strong style={{ color: 'blue' }}>Nested Shadow Component End</strong>
      </Host>
    );
  }
}
