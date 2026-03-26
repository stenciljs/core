import { Component, h, Prop, State, Method, Element } from '@stencil/core';
import { ConflictsBase } from './conflicts-base.js';

/**
 * Tests conflict resolution when component has duplicate
 * @Prop, @State, and @Method names as the base class.
 * Component versions should override base versions.
 */
@Component({
  tag: 'extends-conflicts',
})
export class ExtendsConflicts extends ConflictsBase {
  @Element() el!: HTMLElement;

  // Duplicate @Prop - same name as base, should override
  @Prop() duplicateProp: string = 'component prop value';

  // Duplicate @State - same name as base, should override
  @State() duplicateState: string = 'component state value';

  // Component-specific properties
  @State() componentOnlyState: string = 'component only state';

  // Tracking mechanism for component method calls
  componentMethodCallLog: string[] = [];

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

  render() {
    return (
      <div class='container'>
        <h2>Decorator Conflicts Test</h2>

        <div class='duplicate-props'>
          <h3>Duplicate @Prop (Component Override)</h3>
          <p class='duplicate-prop-value'>Duplicate Prop: {this.duplicateProp}</p>
        </div>

        <div class='duplicate-states'>
          <h3>Duplicate @State (Component Override)</h3>
          <p class='duplicate-state-value'>Duplicate State: {this.duplicateState}</p>
        </div>

        <div class='base-only-props'>
          <h3>Base-Only Properties (Not Duplicated)</h3>
          <p class='base-only-prop-value'>Base Only Prop: {this.baseOnlyProp}</p>
          <p class='base-only-state-value'>Base Only State: {this.baseOnlyState}</p>
        </div>

        <div class='component-only-state'>
          <h3>Component-Only State</h3>
          <p class='component-only-state-value'>Component Only State: {this.componentOnlyState}</p>
        </div>

        <div class='actions'>
          <button
            class='update-duplicate-state'
            onClick={() => this.updateDuplicateState('duplicate state updated')}
          >
            Update Duplicate State
          </button>
          <button
            class='update-component-only-state'
            onClick={() => this.updateComponentOnlyState('component only updated')}
          >
            Update Component Only State
          </button>
        </div>
      </div>
    );
  }
}
