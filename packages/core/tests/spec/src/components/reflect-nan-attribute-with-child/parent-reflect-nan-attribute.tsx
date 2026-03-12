import { Component, h } from '@stencil/core';

@Component({
  tag: 'parent-reflect-nan-attribute',
  // 'shadow' is not needed here, but does make testing easier by using the shadow root to help encapsulate textContent
  shadow: true,
})
export class ParentReflectNanAttribute {
  // counter to proxy the number of times a render has occurred
  renderCount = 0;

  render() {
    this.renderCount += 1;
    return (
      <div>
        <div>parent-reflect-nan-attribute Render Count: {this.renderCount}</div>
        {/*
        // @ts-ignore */}
        <child-reflect-nan-attribute val={'I am not a number!!'}></child-reflect-nan-attribute>
      </div>
    );
  }

  componentDidUpdate() {
    // we don't expect the component to update, this will increment the render count in case it does (and should fail
    // the test)
    this.renderCount += 1;
  }
}
