import { Component, Mixin, Prop, h } from '@stencil/core';

import { WithSuffix } from './my-cross-mixin-factory.js';

@Component({ tag: 'my-cross-mixin-cmp', encapsulation: { type: 'shadow' } })
export class MyCrossMixinCmp extends Mixin(WithSuffix) {
  @Prop() name = 'World';
  render() {
    return (
      <div class='msg'>
        {this.name}
        {this.suffix}
      </div>
    );
  }
}
