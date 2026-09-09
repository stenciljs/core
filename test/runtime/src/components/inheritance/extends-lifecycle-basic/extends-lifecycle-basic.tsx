import { Component, State } from '@stencil/core';

import { LifecycleBase } from './lifecycle-base.js';

@Component({
  tag: 'extends-lifecycle-basic',
})
export class ExtendsLifecycleBasic extends LifecycleBase {
  @State() value: string = '';

  triggerUpdate() {
    this.value = 'updated';
  }

  render() {
    return (
      <div>
        <h2>Lifecycle Inheritance Test</h2>
        <p class='current-value'>Current Value: {this.value}</p>
        <button class='trigger-update' onClick={() => this.triggerUpdate()}>
          Trigger Update
        </button>

        <div class='lifecycle-events'>
          <p class='lifecycle-info'>Events: {(window.lifecycleCalls || []).length} total</p>
        </div>
      </div>
    );
  }
}
