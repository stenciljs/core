import { Component, h } from '@stencil/core';

/**
 * Renders its own content into the default slot of the wrapper component.
 * See #6934.
 */
@Component({
  tag: 'ssr-light-slot-page-cmp',
  shadow: false,
})
export class SsrLightSlotPageCmp {
  render() {
    return (
      <ssr-light-slot-wrap-cmp>
        <div class="inner-projected">Rendered by ssr-light-slot-page-cmp into the default slot</div>
      </ssr-light-slot-wrap-cmp>
    );
  }
}
