import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'attribute-boolean-string',
})
export class AttributeBooleanString {
  @Prop() bool = false;
  @Prop() union: boolean | string = false;

  render() {
    return <div />;
  }
}
