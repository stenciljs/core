import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-level-1',
  styleUrl: 'cmp-level-1.scss',
  shadow: false,
  scoped: true,
})
export class CmpLevel1 {
  render() {
    return (
      <cmp-level-2>
        <slot />
      </cmp-level-2>
    );
  }
}
