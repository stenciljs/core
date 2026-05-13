import { Component } from '@stencil/core';

@Component({
  tag: 'nested-cmp-child',
  styleUrl: `nested-child-cmp.css`,
  encapsulation: { type: 'shadow' },
})
export class NestedCmpChild {
  render() {
    return (
      <div class='some-other-class'>
        <slot></slot>
      </div>
    );
  }
}
