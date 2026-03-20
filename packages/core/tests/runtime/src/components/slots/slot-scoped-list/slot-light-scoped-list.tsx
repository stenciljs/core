import { Component, h } from '@stencil/core';

@Component({
  tag: 'slot-light-scoped-list',
})
export class SlotLightScopedList {
  render() {
    return [
      <section>These are my items:</section>,
      <article class="list-wrapper" style={{ border: '2px solid green' }}>
        <slot></slot>
      </article>,
      <div>That's it....</div>,
    ];
  }
}
