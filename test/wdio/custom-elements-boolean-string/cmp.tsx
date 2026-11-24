import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'custom-elements-boolean-string',
})
export class CustomElementsBooleanString {
  @Prop() bool = false;
  @Prop() union: boolean | string = false;

  render() {
    return <div />;
  }
}
