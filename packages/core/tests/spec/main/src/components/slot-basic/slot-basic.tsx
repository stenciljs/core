import { Component, h } from '@stencil/core';

@Component({
  tag: 'slot-basic',
})
export class SlotBasic {
  render() {
    return (
      <header>
        <section>
          <article>
            <slot />
          </article>
        </section>
      </header>
    );
  }
}
