import { Component, h, State } from '@stencil/core';
import { LifecycleBase } from './lifecycle-base.js';

@Component({
  tag: 'extends-lifecycle-basic',
})
export class LifecycleCmp extends LifecycleBase {

  // State for testing updates
  @State() value: string = '';

  // Method to trigger update lifecycle for testing
  triggerUpdate() {
    this.value = 'updated';
  }

  render() {
    return (
      <div>
        <h2>Lifecycle Inheritance Test</h2>
        <p class="current-value">Current Value: {this.value}</p>
        <button class="trigger-update" onClick={() => this.triggerUpdate()}>Trigger Update</button>
        
        <div class="lifecycle-events">
          <h3>Lifecycle Events tracked to window.lifecycleCalls</h3>
          <p class="lifecycle-info">Events: {((window as any).lifecycleCalls || []).length} total</p>
        </div>
      </div>
    );
  }
}
