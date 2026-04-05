import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-level-2',
  styleUrl: 'cmp-level-2.css',
  
  encapsulation: { type: 'scoped' },
})
export class CmpLevel2 {
  render() {
    return (
      <cmp-level-3>
        <slot />
      </cmp-level-3>
    );
  }
}
