import { Component, Prop, h } from '@stencil/core';

@Component({ tag: 'my-module-cmp', encapsulation: { type: 'shadow' } })
export class MyModuleCmp {
  @Prop() name = 'World';

  render() {
    return <span class='greeting'>Hello, {this.name}!</span>;
  }
}
