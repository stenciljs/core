import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'my-button',
  shadow: true,
})
export class MyButton {
  @Prop() label: string = 'Click me';

  render() {
    return <button>{this.label}</button>;
  }
}
