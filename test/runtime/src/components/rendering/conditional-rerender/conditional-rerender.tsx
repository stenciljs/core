import { Component, h } from '@stencil/core';

@Component({
  tag: 'conditional-rerender',
})
export class ConditionalRerender {
  render() {
    return (
      <main>
        <slot />
        <nav>Nav</nav>
      </main>
    );
  }
}
