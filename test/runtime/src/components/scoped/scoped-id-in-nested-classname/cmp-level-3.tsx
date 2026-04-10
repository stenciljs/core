import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-level-3',
  styleUrl: 'cmp-level-3.css',

  encapsulation: { type: 'scoped' },
})
export class CmpLevel3 {
  render() {
    return (
      <div>
        <slot>DEFAULT</slot>
      </div>
    );
  }
}
