import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-b',
  encapsulation: { type: 'shadow' },
})
export class ComponentB {
  render() {
    return (
      <div>
        <section>
          <span>I am in component B</span>
        </section>
        <cmp-c></cmp-c>
      </div>
    );
  }
}
