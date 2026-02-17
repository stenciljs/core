import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'test-component',
  shadow: true,
})
export class TestComponent {
  /** The text to display */
  @Prop() t!: string;
  render() {
    return <div>Test</div>;
  }
}
