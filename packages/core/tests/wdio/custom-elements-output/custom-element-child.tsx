import { Component, h } from '@stencil/core';

@Component({
  tag: 'custom-element-child',
  shadow: true,
})
export class CustomElementChild {
  render() {
    return (
      <div>
        <strong>Child Component Loaded!</strong>

        <h3>Child Nested Component?</h3>
        <custom-element-nested-child />
      </div>
    );
  }
}
