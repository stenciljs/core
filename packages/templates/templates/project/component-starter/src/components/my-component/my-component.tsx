import { Component, Host } from '@stencil/core';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  encapsulation: { type: 'shadow' },
})
export class MyComponent {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
