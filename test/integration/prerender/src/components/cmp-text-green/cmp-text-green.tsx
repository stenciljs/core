import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-text-green',
  styleUrl: 'cmp-text-green.css',
  encapsulation: { type: 'scoped' },
})
export class CmpTextGreen {
  render() {
    return <text-green>green text, blue border</text-green>;
  }
}
