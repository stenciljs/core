import { Component } from '@stencil/core';

@Component({
  tag: 'slot-children-root',
  encapsulation: { type: 'shadow' },
})
export class SlotChildrenRoot {
  render() {
    return (
      <section>
        ShadowRoot1
        <article>
          <slot />
        </article>
        ShadowRoot2
      </section>
    );
  }
}
