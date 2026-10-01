import { Component, Host } from '@stencil/core';

@Component({
  tag: 'delegates-focus',
  encapsulation: { type: 'shadow', delegatesFocus: true },
  styleUrl: 'delegates-focus.css',
})
export class DelegatesFocus {
  render() {
    return (
      <Host>
        <input />
      </Host>
    );
  }
}
