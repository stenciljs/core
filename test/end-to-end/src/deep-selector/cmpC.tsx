import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-c',
  shadow: true,
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
