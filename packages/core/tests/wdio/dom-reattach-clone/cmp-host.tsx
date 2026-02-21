import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'dom-reattach-clone-host',
  scoped: true,
})
export class DomReattachCloneHost {
  render() {
    return (
      <Host>
        <span class="component-mark-up">Component mark-up</span>
        <slot></slot>
      </Host>
    );
  }
}
