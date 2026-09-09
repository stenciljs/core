import { Component, Method } from '@stencil/core';

import { externalText, externalClass } from './signal-vdom-signals';

@Component({ tag: 'signal-vdom-cmp' })
export class SignalVdomCmp {
  private renderCount = 0;

  @Method() async getRenderCount() {
    return this.renderCount;
  }
  @Method() async getTextSignal() {
    return externalText;
  }
  @Method() async getClassSignal() {
    return externalClass;
  }

  render() {
    this.renderCount++;
    return (
      <div>
        <span class='text'>{externalText}</span>
        <div class={externalClass}>content</div>
      </div>
    );
  }
}
