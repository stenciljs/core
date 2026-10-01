import { Component } from '@stencil/core';

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
  encapsulation: { type: 'scoped' },
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
