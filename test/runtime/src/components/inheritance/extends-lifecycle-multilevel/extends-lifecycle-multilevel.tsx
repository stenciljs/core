import { Component, h, State, Method } from '@stencil/core';
import { ParentBase } from './parent-base.js';

/**
 * Tests multi-level lifecycle inheritance.
 * Component -> ParentBase -> GrandparentBase
 * Each level calls super() and adds its own lifecycle tracking.
 */
@Component({
  tag: 'extends-lifecycle-multilevel',
})
export class ExtendsLifecycleMultilevel extends ParentBase {
  @State() value: string = '';

  componentWillLoad(): void {
    super.componentWillLoad();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentWillLoad');
  }

  componentDidLoad(): void {
    super.componentDidLoad();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentDidLoad');
  }

  componentWillRender(): void {
    super.componentWillRender();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentWillRender');
  }

  componentDidRender(): void {
    super.componentDidRender();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentDidRender');
  }

  componentWillUpdate(): void {
    super.componentWillUpdate();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentWillUpdate');
  }

  componentDidUpdate(): void {
    super.componentDidUpdate();
    (window as any).lifecycleCalls = (window as any).lifecycleCalls || [];
    (window as any).lifecycleCalls.push('Component.componentDidUpdate');
  }

  @Method()
  async triggerUpdate(): Promise<void> {
    this.value = 'updated';
  }

  render() {
    return (
      <div>
        <h2>Multi-Level Lifecycle Inheritance Test</h2>
        <p class="current-value">Current Value: {this.value}</p>
        <button class="trigger-update" onClick={() => this.triggerUpdate()}>
          Trigger Update
        </button>
        <div class="lifecycle-info">
          <h3>Inheritance Chain: Component → ParentBase → GrandparentBase</h3>
          <p class="lifecycle-count">Total lifecycle events: {((window as any).lifecycleCalls || []).length}</p>
        </div>
      </div>
    );
  }
}
