import { Component } from '@stencil/core';

/**
 * A non-shadow component that uses `patches: ['children']` to enable
 * patching of child node accessors (childNodes, children, firstChild, lastChild).
 */
@Component({
  tag: 'patch-children-component',
  encapsulation: { type: 'none', patches: ['children'] },
})
export class PatchChildrenComponent {
  render() {
    return (
      <div class='wrapper'>
        <slot></slot>
      </div>
    );
  }
}
