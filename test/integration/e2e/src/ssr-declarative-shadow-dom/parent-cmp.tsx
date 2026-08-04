import { Component } from '@stencil/core';

@Component({
  tag: 'nested-cmp-parent',
  encapsulation: { type: 'shadow' },
  styleUrl: 'parent-cmp.css',
})
export class NestedCmpParent {
  render() {
    return (
      <div class='some-class'>
        <nested-scope-cmp>
          <slot></slot>
        </nested-scope-cmp>
      </div>
    );
  }
}
