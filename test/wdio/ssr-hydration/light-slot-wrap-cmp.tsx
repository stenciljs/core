import { Component, h, Host } from '@stencil/core';

/**
 * A light-DOM layout wrapper: projects its children through a default slot.
 * Reproduction of #6934 (content rendered into this slot must stay visible
 * after client hydration).
 */
@Component({
  tag: 'ssr-light-slot-wrap-cmp',
  shadow: false,
})
export class SsrLightSlotWrapCmp {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
