import { Component, h } from '@stencil/core';

@Component({
  tag: 'scoped-basic',
  styles: `
    :host {
      display: block;
      background: black;
      color: grey;
    }

    span {
      color: red;
    }

    ::slotted(span) {
      color: yellow;
    }
  `,
  scoped: true,
})
export class ScopedBasic {
  render() {
    return [
      <span>scoped</span>,
      <p>
        <slot />
      </p>,
    ];
  }
}
