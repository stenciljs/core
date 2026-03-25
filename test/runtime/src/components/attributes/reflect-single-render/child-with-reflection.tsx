import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'child-with-reflection',
  // 'shadow' is not needed here, but does make testing easier by using the shadow root to help encapsulate textContent
  shadow: true,
})
export class ChildWithReflection {
  // counter to proxy the number of times a render has occurred
  renderCount = 0;

  // to properly replicate the issue:
  // - `reflect` must be `true`
  // - the type of the prop must be complex, e.g. `number | any`
  // - the value passed in as a prop must not be a `string`
  @Prop({ reflect: true }) val: number | any;

  render() {
    this.renderCount += 1;
    return (
      <div>
        <div>Child Render Count: {this.renderCount}</div>
        <input step={this.val}></input>
      </div>
    );
  }

  componentDidUpdate() {
    this.renderCount += 1;
  }
}
