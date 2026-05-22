import { Component, Method, h } from '@stencil/core';

import { sharedCount, sharedLabel } from '../../shared-signals';

@Component({ tag: 'signal-shared-parent' })
export class SignalSharedParent {
  @Method() async setCount(n: number) { sharedCount.value = n; }
  @Method() async setLabel(s: string) { sharedLabel.value = s; }
  @Method() async getCountSignal() { return sharedCount; }
  @Method() async getLabelSignal() { return sharedLabel; }

  render() {
    return (
      <div>
        <span class='parent-count'>{sharedCount}</span>
        <span class='parent-label'>{sharedLabel}</span>
        <signal-shared-child />
      </div>
    );
  }
}
