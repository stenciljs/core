import { Component, h } from '@stencil/core';

@Component({
  tag: 'custom-element-root-different-name-than-class',
  shadow: true,
})
export class CustomElementRoot {
  render() {
    return (
      <div>
        <h2>Root Element Loaded</h2>
        <custom-element-child-different-name-than-class></custom-element-child-different-name-than-class>
      </div>
    );
  }
}
