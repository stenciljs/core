import { Component, Host, State } from '@stencil/core';

@Component({
  tag: 'css-variables-shadow-dom',
  styleUrl: 'css-variables-shadow-dom.css',
  encapsulation: { type: 'shadow' },
})
export class CssVariablesShadowDom {
  @State() isGreen = false;

  render() {
    return (
      <Host
        class={{
          'set-green': this.isGreen,
        }}
      >
        <div class='inner-div'>Shadow: {this.isGreen ? 'Green' : 'Red'} background</div>
        <div class='black-global-shadow'>Shadow: Black background (global)</div>
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
