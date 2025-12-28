import { Component, h,Host } from '@stencil/core';

@Component({
  tag: 'clone-node-text',
})
export class CloneNodeText {
  render() {
    return (
      <Host>
        <p class="text-content">Clone Node Text</p>
      </Host>
    );
  }
}
