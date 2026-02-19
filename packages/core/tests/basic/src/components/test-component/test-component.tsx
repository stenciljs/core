import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'test-component',
  shadow: true,
  styleUrl: 'test-components.css',
})
export class TestComponent {
  /** The text to display */
  @Prop() t!: string;
  render() {
    return <div>Test?????********</div>
  }
}
