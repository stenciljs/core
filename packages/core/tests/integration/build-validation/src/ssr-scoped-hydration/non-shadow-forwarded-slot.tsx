import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'non-shadow-forwarded-slot',
  scoped: true,
  styles: `
    :host {
      display: block;
      border: 3px solid red;
    }
    :host strong {
      color: red;
    }
  `,
})
export class Wrapper {
  render() {
    return (
      <Host>
        <strong>Non shadow parent. Start.</strong>
        <br />

        <shadow-child>
          <slot>This is default content in the non-shadow parent slot</slot>
        </shadow-child>

        <br />
        <strong>Non shadow parent. End.</strong>
      </Host>
    );
  }
}
