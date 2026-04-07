import { Component, h } from '@stencil/core';

/**
 * A non-shadow component that uses `patches: ['insert']` to enable
 * patching of appendChild(), insertBefore(), etc. for slot relocation.
 */
@Component({
  tag: 'patch-insert-component',
  encapsulation: { type: 'none', patches: ['insert'] },
})
export class PatchInsertComponent {
  render() {
    return (
      <div class='wrapper'>
        <slot></slot>
      </div>
    );
  }
}
