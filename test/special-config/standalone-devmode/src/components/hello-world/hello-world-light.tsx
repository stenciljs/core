import { Component } from '@stencil/core';

@Component({
  tag: 'hello-world-light',
  styleUrl: 'hello-world.css',
})
export class HelloWorldLight {
  render() {
    return (
      <div class='hello'>
        Hello, World!???? <slot />
      </div>
    );
  }
}
