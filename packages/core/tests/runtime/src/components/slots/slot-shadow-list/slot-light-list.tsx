import { Component, h } from '@stencil/core';

@Component({
  tag: 'slot-light-list',
})
export class SlotLightList {
  render() {
    return [
      <section>These are my items:</section>,
      <article class="list-wrapper" style={{ border: '2px solid blue' }}>
        <slot></slot>
      </article>,
      <div>That's it....</div>,
    ];
  }
}
