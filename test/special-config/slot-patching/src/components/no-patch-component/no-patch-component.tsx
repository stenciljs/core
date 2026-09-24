import { Component } from '@stencil/core';

/**
 * A non-shadow component WITHOUT any patches enabled.
 * Used as a control to compare against patched components.
 */
@Component({
  tag: 'no-patch-component',
  encapsulation: { type: 'none' },
})
export class NoPatchComponent {
  render() {
    return (
      <div class='wrapper'>
        <slot></slot>
      </div>
    );
  }
}
