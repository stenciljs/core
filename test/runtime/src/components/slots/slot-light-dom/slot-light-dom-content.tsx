import { Component, h } from '@stencil/core';

@Component({
  tag: 'slot-light-dom-content',
})
export class SlotLightDomContent {
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
