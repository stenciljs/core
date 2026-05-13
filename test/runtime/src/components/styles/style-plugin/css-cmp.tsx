import { Component, Host } from '@stencil/core';

@Component({
  tag: 'css-cmp',
  styleUrl: 'css-entry.css',
  encapsulation: { type: 'shadow' },
})
export class CssCmp {
  render() {
    return (
      <Host>
        <div class='css-entry'>Css Entry</div>
        <div class='css-importee'>Css Importee</div>
        <hr />
      </Host>
    );
  }
}
