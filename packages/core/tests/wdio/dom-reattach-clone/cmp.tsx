import { Component, h } from '@stencil/core';

@Component({
  tag: 'dom-reattach-clone',
  scoped: true,
})
export class DomReattachClone {
  render() {
    return (
      <div class="wrapper">
        <span class="component-mark-up">Component mark-up</span>
        <slot></slot>
      </div>
    );
  }
}
