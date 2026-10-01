import { Component, Prop, h } from '@stencil/core';

@Component({ tag: 'my-button', encapsulation: { type: 'shadow' } })
export class MyButton {
  @Prop() label = 'Click me';
  render() {
    return <button>{this.label}</button>;
  }
}
