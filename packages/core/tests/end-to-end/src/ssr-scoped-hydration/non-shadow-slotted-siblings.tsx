import { Component, h } from '@stencil/core';

@Component({
  tag: 'hydrated-sibling-accessors',
  scoped: true,
})
export class HydratedSiblingAccessors {
  render() {
    return (
      <div>
        Internal text node before slot
        <slot />
        <div>Internal element before second slot, after first slot</div>
        <slot name="second-slot">Second slot fallback text</slot>
      </div>
    );
  }
}
