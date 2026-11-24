import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'inner-content-patch-scoped',
  scoped: true,
})
export class InnerContentPatchScoped {
  @Prop() count = 0;

  render() {
    return (
      <div class="wrap">
        <span class="count">{this.count}</span>
        <slot />
      </div>
    );
  }
}
