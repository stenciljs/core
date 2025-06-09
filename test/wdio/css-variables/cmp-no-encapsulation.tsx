import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'css-variables-no-encapsulation',
  styleUrl: 'cmp-no-encapsulation.css',
})
export class CssVariablesNoEncapsulation {
  render() {
    return (
      <Host>
        <div class="black-local">No encapsulation: Black background</div>
        <div class="black-global">No encapsulation: Black background (global style)</div>
        <div class="yellow-global">No encapsulation: Yellow background (global link)</div>
      </Host>
    );
  }
}
