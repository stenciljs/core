import { Component, h } from '@stencil/core';

@Component({
  tag: 'text-content-patch-scoped-with-slot',
  encapsulation: { type: 'scoped' },
})
export class TextContentPatchScopedWithSlot {
  render() {
    return [<p>Top content</p>, <slot></slot>, <p>Bottom content</p>, <slot name='suffix'></slot>];
  }
}
