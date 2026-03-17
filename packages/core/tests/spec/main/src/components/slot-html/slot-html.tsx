import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-html',
})
export class SlotHtml {
  @Prop() inc = 0;

  render() {
    return (
      <div>
        <hr />
        <article>
          <span>
            <slot name="start" />
          </span>
        </article>
        <slot />
        <section>
          <slot name="end" />
        </section>
      </div>
    );
  }
}
