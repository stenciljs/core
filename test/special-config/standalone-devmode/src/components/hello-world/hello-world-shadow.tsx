import { Component, h } from '@stencil/core';

@Component({
  tag: 'hello-world-shadow',
  styleUrl: 'hello-world.css',
  encapsulation: {
    type: 'shadow',
  },
})
export class HelloWorldShadow {
  render() {
    return (
      <div class='hello'>
        Hello, World! <slot />
      </div>
    );
  }
}
