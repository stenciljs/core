import { Component, h } from '@stencil/core';

@Component({
  tag: 'remove-child-patch',
  scoped: true,
})
export class RemoveChildPatch {
  render() {
    return (
      <div>
        <p>I'm not in a slot</p>
        <div class="slot-container">
          <slot>Slot fallback content</slot>
        </div>
      </div>
    );
  }
}
