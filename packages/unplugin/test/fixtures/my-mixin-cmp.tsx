import { Component, Mixin, MixedInCtor, Prop, h } from '@stencil/core';

const WithGreeter = <B extends MixedInCtor>(Base: B) => {
  class Mixed extends Base {
    // @Prop declared on a same-file mixin factory class — exercises the
    // resolveImport-based transpile path's same-file Mixin(...) lookup.
    @Prop() excited: boolean = false;
    greet(name: string) {
      return `Hello, ${name}${this.excited ? '!!!' : '!'}`;
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
