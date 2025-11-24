import { Component, h, State } from '@stencil/core';
import { ParentBase } from './parent-base.js';

@Component({
  tag: 'extends-lifecycle-multilevel',
})
export class MultiLevelLifecycleCmp extends ParentBase {

  // State for testing updates
  @State() value: string = '';

  // Override lifecycle methods to call super() and add component-level tracking
  componentWillLoad() {
    super.componentWillLoad();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentWillLoad');
  }

  componentDidLoad() {
    super.componentDidLoad();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentDidLoad');
  }

  componentWillRender() {
    super.componentWillRender();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentWillRender');
  }

  componentDidRender() {
    super.componentDidRender();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentDidRender');
  }

  componentWillUpdate() {
    super.componentWillUpdate();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentWillUpdate');
  }

  componentDidUpdate() {
    super.componentDidUpdate();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentDidUpdate');
  }

  // Method to trigger update lifecycle for testing
  triggerUpdate() {
    this.value = 'updated';
  }

  render() {
    return (
      <div>
        <h2>Multi-Level Lifecycle Inheritance Test</h2>
        <p class="current-value">Current Value: {this.value}</p>
        <button class="trigger-update" onClick={() => this.triggerUpdate()}>Trigger Update</button>
        
        <div class="lifecycle-info">
          <h3>Inheritance Chain: Component → ParentBase → GrandparentBase</h3>
          <p class="lifecycle-count">Total lifecycle events: {((window as any).lifecycleCalls || []).length}</p>
        </div>
      </div>
    );
  }
}
