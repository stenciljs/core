import { Component, Prop, h } from '@stencil/core';

@Component({ tag: 'my-card', styleUrl: 'my-card.css', encapsulation: { type: 'shadow' } })
export class MyCard {
  @Prop() heading = 'Card';
  render() {
    return <div class='card'>{this.heading}</div>;
  }
}
