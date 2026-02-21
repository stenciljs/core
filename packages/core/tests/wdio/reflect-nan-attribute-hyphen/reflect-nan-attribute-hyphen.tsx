import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'reflect-nan-attribute-hyphen',
  // 'shadow' is not needed here, but does make testing easier by using the shadow root to help encapsulate textContent
  shadow: true,
})
export class ReflectNanAttributeHyphen {
  // for this test, it's necessary that 'reflect' is true, the class member is camel-cased, and is of type 'number'
  @Prop({ reflect: true }) valNum: number;

  // counter to proxy the number of times a render has occurred
  renderCount = 0;

  render() {
    this.renderCount += 1;
    return <div>reflect-nan-attribute-hyphen Render Count: {this.renderCount}</div>;
  }

  componentDidUpdate() {
    // we don't expect the component to update, this will increment the render count in case it does (and should fail
    // the test)
    this.renderCount += 1;
  }
}
