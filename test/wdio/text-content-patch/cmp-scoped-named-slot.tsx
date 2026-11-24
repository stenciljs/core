import { Component, h } from '@stencil/core';

@Component({
  tag: 'text-content-patch-scoped-named-slot',
  scoped: true,
})
export class TextContentPatchScopedNamedSlot {
  render() {
    return [<p>Top content</p>, <slot name="suffix"></slot>];
  }
}
