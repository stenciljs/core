import { Component, Element, h, Method, Prop, State } from '@stencil/core';
import { MixedDecoratorsBase } from './mixed-decorators-base.js';

/**
 * MixedDecoratorsCmp - Demonstrates mixed decorator type conflicts in inheritance chains
 * 
 * This component:
 * 1. Extends MixedDecoratorsBase (inherits base decorators)
 * 2. Defines conflicting decorators with same names but different decorator types
 * 3. Verifies runtime behavior when mixed decorator types exist
 * 4. Renders UI showing which decorator type is active (component decorator type should win)
 */
@Component({
  tag: 'extends-mixed-decorators',
})
export class MixedDecoratorsCmp extends MixedDecoratorsBase {
  @Element() el!: HTMLElement;
  
  // Mixed decorator type conflicts - same name, different decorator type
  // Base has @Prop, component has @State - component @State should override base @Prop
  @State() mixedName: string = 'component state value';
  
  // Base has @State, component has @Prop - component @Prop should override base @State
  @Prop() mixedStateName: string = 'component prop value';
  
  // Base has @Method, component has @Prop - component @Prop should override base @Method
  // @ts-expect-error - Intentional mixed decorator type conflict for testing runtime behavior
  @Prop() mixedMethodName: string = 'component prop value';
  
  // Component-specific properties for comparison
  @State() componentOnlyState: string = 'component only state';
  
  /**
   * Method to update mixedName state for testing
   */
  @Method()
  async updateMixedName(value: string): Promise<void> {
    this.mixedName = value;
  }
  
  /**
   * Method to update component-only state
   */
  @Method()
  async updateComponentOnlyState(value: string): Promise<void> {
    this.componentOnlyState = value;
  }
  
  render() {
    return (
      <div class="container">
        <h2>Mixed Decorator Types Test</h2>
        
        <div class="prop-state-conflict">
          <h3>@Prop in Base, @State in Component (mixedName)</h3>
          <p class="mixed-name-value">Mixed Name: {this.mixedName}</p>
          <p class="mixed-name-type">Expected: component state value (component @State overrides base @Prop)</p>
        </div>
        
        <div class="state-prop-conflict">
          <h3>@State in Base, @Prop in Component (mixedStateName)</h3>
          <p class="mixed-state-name-value">Mixed State Name: {this.mixedStateName}</p>
          <p class="mixed-state-name-type">Expected: component prop value (component @Prop overrides base @State)</p>
        </div>
        
        <div class="method-prop-conflict">
          <h3>@Method in Base, @Prop in Component (mixedMethodName)</h3>
          <p class="mixed-method-name-value">Mixed Method Name: {this.mixedMethodName}</p>
          <p class="mixed-method-name-type">Expected: component prop value (component @Prop overrides base @Method)</p>
        </div>
        
        <div class="base-only-props">
          <h3>Base-Only Properties (Not Conflicted)</h3>
          <p class="base-only-prop-value">Base Only Prop: {this.baseOnlyProp}</p>
          <p class="base-only-state-value">Base Only State: {this.baseOnlyState}</p>
        </div>
        
        <div class="component-only-state">
          <h3>Component-Only State</h3>
          <p class="component-only-state-value">Component Only State: {this.componentOnlyState}</p>
        </div>
        
        <div class="actions">
          <button class="update-mixed-name" onClick={() => this.updateMixedName('mixed name updated')}>
            Update Mixed Name (State)
          </button>
          <button class="update-component-only-state" onClick={() => this.updateComponentOnlyState('component only updated')}>
            Update Component Only State
          </button>
        </div>
        
        <div class="test-info">
          <p>Features: @Prop/@State conflicts | @State/@Prop conflicts | @Method/@Prop conflicts | Runtime behavior</p>
        </div>
      </div>
    );
  }
}

