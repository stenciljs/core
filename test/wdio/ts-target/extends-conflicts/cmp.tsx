import { Component, Element, h, Method, Prop, State } from '@stencil/core';
import { ConflictsBase } from './conflicts-base.js';

/**
 * ConflictsCmp - Demonstrates decorator conflicts in inheritance chains
 * 
 * This component:
 * 1. Extends ConflictsBase (inherits base decorators)
 * 2. Defines duplicate decorators with same names but different values/behavior
 * 3. Verifies component decorators override base decorators
 * 4. Renders UI showing which version is active (component should win)
 */
@Component({
  tag: 'extends-conflicts',
})
export class ConflictsCmp extends ConflictsBase {
  @Element() el!: HTMLElement;
  
  // Duplicate @Prop - same name as base, should override
  @Prop() duplicateProp: string = 'component prop value';
  
  // Duplicate @State - same name as base, should override
  @State() duplicateState: string = 'component state value';
  
  // Component-specific properties
  @State() componentOnlyState: string = 'component only state';
  
  // Tracking mechanism for component method calls
  protected componentMethodCallLog: string[] = [];
  
  /**
   * Duplicate method - same name as base, should override
   * Component version should be called, not base version
   */
  @Method()
  async duplicateMethod(): Promise<string> {
    this.componentMethodCallLog.push('duplicateMethod:component');
    return 'component method';
  }
  
  /**
   * Method to update duplicate state for testing
   */
  @Method()
  async updateDuplicateState(value: string): Promise<void> {
    this.duplicateState = value;
  }
  
  /**
   * Method to update component-only state
   */
  @Method()
  async updateComponentOnlyState(value: string): Promise<void> {
    this.componentOnlyState = value;
  }
  
  /**
   * Method to get component method call log
   */
  @Method()
  async getComponentMethodCallLog(): Promise<string[]> {
    return [...this.componentMethodCallLog];
  }
  
  /**
   * Method to reset component call log
   */
  @Method()
  async resetComponentMethodCallLog(): Promise<void> {
    this.componentMethodCallLog = [];
  }
  
  /**
   * Method to get combined call log (base + component)
   */
  @Method()
  async getCombinedMethodCallLog(): Promise<string[]> {
    const baseLog = await super.getMethodCallLog();
    return [...baseLog, ...this.componentMethodCallLog];
  }
  
  /**
   * Method to reset all call logs
   */
  @Method()
  async resetAllCallLogs(): Promise<void> {
    await super.resetMethodCallLog();
    this.componentMethodCallLog = [];
  }
  
  render() {
    return (
      <div class="container">
        <h2>Decorator Conflicts Test</h2>
        
        <div class="duplicate-props">
          <h3>Duplicate @Prop (Component Override)</h3>
          <p class="duplicate-prop-value">Duplicate Prop: {this.duplicateProp}</p>
          <p class="expected-prop-value">Expected: component prop value (component override)</p>
        </div>
        
        <div class="duplicate-states">
          <h3>Duplicate @State (Component Override)</h3>
          <p class="duplicate-state-value">Duplicate State: {this.duplicateState}</p>
          <p class="expected-state-value">Expected: component state value (component override)</p>
        </div>
        
        <div class="base-only-props">
          <h3>Base-Only Properties (Not Duplicated)</h3>
          <p class="base-only-prop-value">Base Only Prop: {this.baseOnlyProp}</p>
          <p class="base-only-state-value">Base Only State: {this.baseOnlyState}</p>
        </div>
        
        <div class="component-only-state">
          <h3>Component-Only State</h3>
          <p class="component-only-state-value">Component Only State: {this.componentOnlyState}</p>
        </div>
        
        <div class="actions">
          <button class="update-duplicate-state" onClick={() => this.updateDuplicateState('duplicate state updated')}>
            Update Duplicate State
          </button>
          <button class="update-component-only-state" onClick={() => this.updateComponentOnlyState('component only updated')}>
            Update Component Only State
          </button>
        </div>
        
        <div class="test-info">
          <p>Features: Duplicate @Prop names | Duplicate @State names | Duplicate @Method names | Compiler precedence rules</p>
        </div>
      </div>
    );
  }
}

