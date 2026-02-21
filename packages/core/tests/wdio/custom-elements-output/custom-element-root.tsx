import { Component, h } from '@stencil/core';

@Component({
  tag: 'custom-element-root',
  shadow: true,
})
export class CustomElementRoot {
  render() {
    return (
      <div>
        <h2>Root Element Loaded</h2>

        <h3>Child Component Loaded?</h3>
        <custom-element-child />
      </div>
    );
  }
}
