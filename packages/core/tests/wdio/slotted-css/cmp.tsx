import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'slotted-css',
  styleUrl: 'cmp.css',
  shadow: true,
})
export class SlottedCss {
  render() {
    return (
      <Host>
        <section>
          <header>
            <slot name="header-slot-name" />
          </header>
          <section class="content">
            <slot />
          </section>
          <footer>
            <slot name="footer-slot-name" />
          </footer>
        </section>
      </Host>
    );
  }
}
