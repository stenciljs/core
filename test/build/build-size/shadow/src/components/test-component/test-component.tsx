import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'test-component',
  encapsulation: { type: 'shadow' },
})
export class TestComponent {
  /** The text to display */
  @Prop() t: string;
  render() {
    return (
      <div>
        <slot>test</slot>
      </div>
    );
  }
}
