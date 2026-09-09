import { Component, Prop, State } from '@stencil/core';

@Component({
  tag: 'hello-world-shadow',
  styleUrl: 'hello-world.css',
  encapsulation: {
    type: 'shadow',
  },
})
export class HelloWorldShadow {
  @Prop() name: string = 'World';
  @State() count: number = 0;

  connectedCallback() {
    this.count++;
    console.log('connectedCallback for shadow dom component', this.count);
  }
  render() {
    this.count++;
    console.log('rendering shadow dom component', this.count);
    return (
      <div class='hello'>
        Hello, {this.name}! ---
        <slot />
        {this.count}
      </div>
    );
  }
}
