import { Component } from '@stencil/core';

/**
 * A non-shadow component that uses `patches: ['clone']` to enable
 * patching of cloneNode() to properly handle slotted content.
 */
@Component({
  tag: 'patch-clone-component',
  encapsulation: { type: 'none', patches: ['clone'] },
})
export class PatchCloneComponent {
  render() {
    return (
      <div class='wrapper'>
        <slot></slot>
      </div>
    );
  }
}
