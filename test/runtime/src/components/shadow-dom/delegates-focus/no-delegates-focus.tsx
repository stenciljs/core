import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'no-delegates-focus',
  shadow: {
    delegatesFocus: false,
  },
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
