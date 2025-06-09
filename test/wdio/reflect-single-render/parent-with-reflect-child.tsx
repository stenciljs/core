import { Component, h } from '@stencil/core';

@Component({
  tag: 'parent-with-reflect-child',
  // 'shadow' is not needed here, but does make testing easier by using the shadow root to help encapsulate textContent
  shadow: true,
})
export class MyComponent {
  // counter to proxy the number of times a render has occurred
  renderCount = 0;

  render() {
    this.renderCount += 1;
    return (
      <div>
        <div>Parent Render Count: {this.renderCount}</div>
        <child-with-reflection val={1}></child-with-reflection>
      </div>
    );
  }

  componentDidUpdate() {
    this.renderCount += 1;
  }
}
