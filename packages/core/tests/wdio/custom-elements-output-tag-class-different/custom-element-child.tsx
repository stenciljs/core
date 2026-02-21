import { Component, h } from '@stencil/core';

@Component({
  tag: 'custom-element-child-different-name-than-class',
  shadow: true,
})
export class CustomElementChild {
  render() {
    return (
      <div>
        <strong>Child Component Loaded!</strong>
      </div>
    );
  }
}
