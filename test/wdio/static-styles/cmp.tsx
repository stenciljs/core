import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'static-styles',
})
export class StaticStyles {
  render() {
    return (
      <Host>
        <h1>static get styles()</h1>
      </Host>
    );
  }

  static get styles() {
    return `
      h1 {
        color: red;
      }
    `;
  }
}
