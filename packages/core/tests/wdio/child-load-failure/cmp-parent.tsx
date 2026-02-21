import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-parent',
})
export class CmpParent {
  render() {
    return (
      <div>
        <div class="parent-content">Parent Loaded</div>
        <cmp-child-fail></cmp-child-fail>
      </div>
    );
  }
}
