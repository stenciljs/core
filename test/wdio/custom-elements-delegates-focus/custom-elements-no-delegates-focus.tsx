import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'custom-elements-no-delegates-focus',
  styleUrl: 'shared-delegates-focus.css',
  shadow: true,
})
export class CustomElementsNoDelegatesFocus {
  render() {
    return (
      <Host>
        <input />
      </Host>
    );
  }
}
