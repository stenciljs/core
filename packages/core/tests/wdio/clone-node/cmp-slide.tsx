import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'clone-node-slide',
})
export class CloneNodeSlide {
  render() {
    return (
      <Host>
        <p class="slide-content">Slide Content</p>
        <slot></slot>
      </Host>
    );
  }
}
