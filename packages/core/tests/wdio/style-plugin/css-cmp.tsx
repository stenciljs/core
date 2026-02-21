import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'css-cmp',
  styleUrl: 'css-entry.css',
  shadow: true,
})
export class CssCmp {
  render() {
    return (
      <Host>
        <div class="css-entry">Css Entry</div>
        <div class="css-importee">Css Importee</div>
        <hr />
      </Host>
    );
  }
}
