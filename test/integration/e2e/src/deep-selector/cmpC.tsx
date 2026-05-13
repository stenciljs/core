import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-c',
  encapsulation: { type: 'shadow' },
})
export class ComponentC {
  render() {
    return (
      <div>
        <span>I am in component C</span>
      </div>
    );
  }
}
