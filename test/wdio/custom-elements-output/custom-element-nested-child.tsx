import { Component, h } from '@stencil/core';

@Component({
  tag: 'custom-element-nested-child',
  shadow: true,
})
export class CustomElementNestedChild {
  render() {
    return (
      <div>
        <strong>Child Nested Component Loaded!</strong>
      </div>
    );
  }
}
