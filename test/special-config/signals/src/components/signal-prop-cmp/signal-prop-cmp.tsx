import { Component, Prop } from '@stencil/core';

@Component({ tag: 'signal-prop-cmp' })
export class SignalPropCmp {
  @Prop() label = 'default';
  @Prop() value = 0;

  render() {
    return (
      <div>
        <span class='label'>{this.label}</span>
        <span class='value'>{this.value}</span>
      </div>
    );
  }
}
