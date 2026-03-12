import { Component, h } from '@stencil/core';

@Component({
  tag: 'slot-array-basic',
  styleUrl: 'slot-array-basic.css',
  shadow: false,
})
export class SlotArrayBasic {
  render() {
    return [<header>Header</header>, <slot />, <footer>Footer</footer>];
  }
}
