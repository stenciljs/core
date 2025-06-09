import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'custom-elements-delegates-focus',
  styleUrl: 'shared-delegates-focus.css',
  shadow: {
    delegatesFocus: true,
  },
})
export class CustomElementsDelegatesFocus {
  render() {
    return (
      <Host>
        <input />
      </Host>
    );
  }
}
