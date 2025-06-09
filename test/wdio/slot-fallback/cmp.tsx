import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-fallback',
})
export class SlotFallback {
  @Prop() inc = 0;

  render() {
    return (
      <div>
        <hr />
        <slot name="start">slot start fallback {this.inc}</slot>
        <section>
          <slot>slot default fallback {this.inc}</slot>
        </section>
        <article>
          <span>
            <slot name="end">slot end fallback {this.inc}</slot>
          </span>
        </article>
      </div>
    );
  }
}
