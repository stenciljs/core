import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'slot-no-default',
  shadow: false,
})
export class SlotNoDefault {
  render() {
    return (
      <Host>
        <slot name="a-slot-name" />
        <section>
          <slot name="footer-slot-name" />
        </section>
        <div>
          <article>
            <slot name="nav-slot-name" />
          </article>
        </div>
      </Host>
    );
  }
}
