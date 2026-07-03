import { Component, Mixin, MixedInCtor, Prop, h } from '@stencil/core';

const WithGreeter = <B extends MixedInCtor>(Base: B) => {
  class Mixed extends Base {
    greet(name: string) {
      return `Hello, ${name}!`;
    }
  }
  return Mixed;
};

@Component({ tag: 'my-mixin-cmp', encapsulation: { type: 'shadow' } })
export class MyMixinCmp extends Mixin(WithGreeter) {
  @Prop() name = 'World';
  render() {
    return <div class='msg'>{this.greet(this.name)}</div>;
  }
}
