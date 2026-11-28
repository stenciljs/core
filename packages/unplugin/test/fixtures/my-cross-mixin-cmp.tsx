import { Component, Mixin, Prop, h } from '@stencil/core';

import { WithPrefix, WithSuffix } from './my-cross-mixin-factory.js';

@Component({ tag: 'my-cross-mixin-cmp', encapsulation: { type: 'shadow' } })
export class MyCrossMixinCmp extends Mixin(WithPrefix, WithSuffix) {
  @Prop() name = 'World';
  render() {
    return (
      <div class='msg'>
        {this.prefix}
        {this.name}
        {this.suffix}
      </div>
    );
  }
}
