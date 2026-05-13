import { Component } from '@stencil/core';

/**
 * A non-shadow component that uses multiple patches combined:
 * `patches: ['children', 'clone', 'insert']`
 *
 * This tests that individual patches can be combined without using 'all'.
 */
@Component({
  tag: 'patch-combined-component',
  encapsulation: { type: 'none', patches: ['children', 'clone', 'insert'] },
})
export class PatchCombinedComponent {
  render() {
    return (
      <div class='wrapper'>
        <slot></slot>
      </div>
    );
  }
}
