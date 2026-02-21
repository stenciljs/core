import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-b',
  shadow: true,
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
