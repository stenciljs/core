import { Component, h, Prop, State, Method } from '@stencil/core';
import { PropsStateBase } from './props-state-base.js';

/**
 * Test Case #3: Property & State Inheritance Basics
 * 
 * This component extends PropsStateBase to test:
 * - @Prop inheritance from base class
 * - @State inheritance from base class
 * - Additional @Prop and @State without conflicts
 * - Property reactivity (inherited props/state trigger re-renders)
 */
@Component({
  tag: 'extends-props-state',
})
export class PropsStateCmp extends PropsStateBase {
  // Component-specific @Prop (in addition to inherited baseProp, baseCount)
  @Prop() componentProp: string = 'component prop value';
  
  // Component-specific @State (in addition to inherited baseState, baseEnabled)
  @State() componentState: string = 'component state value';
  
  // Method to update inherited state (tests reactivity of inherited @State)
  @Method()
  async updateBaseState(value: string) {
    this.baseState = value;
  }
  
  // Method to update component state (tests reactivity of component @State)
  @Method()
  async updateComponentState(value: string) {
    this.componentState = value;
  }
  
  // Method to toggle inherited boolean state
  @Method()
  async toggleBaseEnabled() {
    this.baseEnabled = !this.baseEnabled;
  }
  
  // Method to increment inherited number prop
  @Method()
  async incrementBaseCount() {
    this.baseCount++;
  }

  render() {
    return (
      <div class="container">
        <h2>Props & State Inheritance Test</h2>
        
        <div class="inherited-props">
          <h3>Inherited Props</h3>
          <p class="base-prop">Base Prop: {this.baseProp}</p>
          <p class="base-count">Base Count: {this.baseCount}</p>
        </div>
        
        <div class="inherited-state">
          <h3>Inherited State</h3>
          <p class="base-state">Base State: {this.baseState}</p>
          <p class="base-enabled">Base Enabled: {this.baseEnabled ? 'true' : 'false'}</p>
        </div>
        
        <div class="component-props">
          <h3>Component Props</h3>
          <p class="component-prop">Component Prop: {this.componentProp}</p>
        </div>
        
        <div class="component-state">
          <h3>Component State</h3>
          <p class="component-state-value">Component State: {this.componentState}</p>
        </div>
        
        <div class="actions">
          <button class="update-base-state" onClick={() => this.updateBaseState('base state updated')}>
            Update Base State
          </button>
          <button class="update-component-state" onClick={() => this.updateComponentState('component state updated')}>
            Update Component State
          </button>
          <button class="toggle-base-enabled" onClick={() => this.toggleBaseEnabled()}>
            Toggle Base Enabled
          </button>
          <button class="increment-base-count" onClick={() => this.incrementBaseCount()}>
            Increment Base Count
          </button>
        </div>
      </div>
    );
  }
}

