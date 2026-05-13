import { Component } from '@stencil/core';

@Component({
  tag: 'styleurls-component',
  encapsulation: { type: 'shadow' },
  // CSS properties documented in both of these files should
  // show up in this component's README
  styleUrls: {
    one: 'one.scss',
    two: 'two.scss',
  },
})
export class StyleUrlsComponent {
  render() {
    return <div>Hello, World! I have multiple style URLs!</div>;
  }
}
