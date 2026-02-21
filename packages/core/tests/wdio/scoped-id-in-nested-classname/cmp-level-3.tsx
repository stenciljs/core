import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-level-3',
  styleUrl: 'cmp-level-3.scss',
  shadow: false,
  scoped: true,
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
