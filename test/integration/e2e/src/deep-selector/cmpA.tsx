import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-a',
  encapsulation: { type: 'shadow' },
})
export class ComponentA {
  render() {
    return (
      <div>
        <section>
          <span>I am in component A</span>
        </section>
        <cmp-b></cmp-b>
      </div>
    );
  }
}
