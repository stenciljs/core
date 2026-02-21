import { Component, h, Host, State } from '@stencil/core';

@Component({
  tag: 'css-variables-shadow-dom',
  styleUrl: 'cmp-shadow-dom.css',
  shadow: true,
})
export class CssVariablesRoot {
  @State() isGreen = false;

  render() {
    return (
      <Host
        class={{
          'set-green': this.isGreen,
        }}
      >
        <div class="inner-div">Shadow: {this.isGreen ? 'Green' : 'Red'} background</div>
        <div class="black-global-shadow">Shadow: Black background (global)</div>
        <button
          onClick={() => {
            this.isGreen = !this.isGreen;
          }}
        >
          Toggle color
        </button>
      </Host>
    );
  }
}
