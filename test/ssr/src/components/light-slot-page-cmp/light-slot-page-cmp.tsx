import { Component } from '@stencil/core';

/** No encapsulation; renders its own content into `light-slot-wrap-cmp`'s default slot. */
@Component({
  tag: 'light-slot-page-cmp',
})
export class LightSlotPageCmp {
  render() {
    return (
      <light-slot-wrap-cmp>
        <div class='projected'>projected content</div>
      </light-slot-wrap-cmp>
    );
  }
}
