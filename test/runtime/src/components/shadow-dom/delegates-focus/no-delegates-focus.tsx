import { Component, Host } from '@stencil/core';

@Component({
  tag: 'no-delegates-focus',
  encapsulation: { type: 'shadow', delegatesFocus: false },
  styleUrl: 'delegates-focus.css',
})
export class NoDelegatesFocus {
  render() {
    return (
      <Host>
        <input />
      </Host>
    );
  }
}
