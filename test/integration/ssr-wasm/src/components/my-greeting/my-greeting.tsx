import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'my-greeting',
  encapsulation: {
    type: 'shadow',
  },
})
export class MyGreeting {
  @Prop() name: string = 'World';

  render() {
    return <div class='greeting'>Hello, {this.name}!</div>;
  }
}
