import { Component, Host } from '@stencil/core';

@Component({
  tag: 'sass-cmp',
  styleUrl: 'sass-entry.scss',
  encapsulation: { type: 'shadow' },
})
export class SassCmp {
  render() {
    return (
      <Host>
        <div class='sass-entry'>Sass Entry</div>
        <div class='sass-importee'>Sass Importee</div>
        <div class='css-importee'>Css Importee</div>
        <button class='btn btn-primary'>Bootstrap</button>
        <hr />
      </Host>
    );
  }
}
