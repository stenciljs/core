import { Component, h } from '@stencil/core';

/**
 * A non-shadow component that uses `patches: ['all']` to enable
 * all slot-related DOM patching (childNodes, appendChild, cloneNode, etc.)
 */
@Component({
  tag: 'patch-all-component',
  encapsulation: { type: 'none', patches: ['all'] },
})
export class PatchAllComponent {
  render() {
    return (
      <div class='wrapper'>
        <slot></slot>
      </div>
    );
  }
}
