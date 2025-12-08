import { Component, Element, h, Method, Prop, State, Watch } from '@stencil/core';
import { WatchBase } from './watch-base.js';

/**
 * WatchCmp - Demonstrates @Watch decorator inheritance
 * 
 * This component:
 * 1. Extends WatchBase (inherits base @Watch decorators)
 * 2. Adds additional @Watch decorators
 * 3. Overrides base watch handler (overrideProp)
 * 4. Demonstrates watch execution order
 * 5. Demonstrates reactive property chains
 */
@Component({
  tag: 'extends-watch',
})
export class WatchCmp extends WatchBase {
  @Element() el!: HTMLElement;
  
  // Child-specific properties with watch decorators
  @Prop() childProp: string = 'child prop initial';
  @State() childState: string = 'child state initial';
  @State() childCounter: number = 0;
  
  // Track child watch handler execution
  @State() childWatchLog: string[] = [];
  @State() childWatchCallCount: number = 0;
  
  // Additional reactive chain property
  @State() childChainTriggered: boolean = false;
  
  // Watch childProp - child-specific watch handler
  @Watch('childProp')
  childPropChanged(newValue: string, oldValue: string) {
    this.childWatchLog.push(`childPropChanged:${oldValue}->${newValue}`);
    this.childWatchCallCount++;
    
    // Reactive chain: update childState
    this.childState = `state updated by childProp: ${newValue}`;
  }
  
  // Watch childState - child-specific watch handler
  @Watch('childState')
  childStateChanged(newValue: string, oldValue: string) {
    this.childWatchLog.push(`childStateChanged:${oldValue}->${newValue}`);
    this.childWatchCallCount++;
  }
  
  // Watch childCounter - child-specific watch handler
  @Watch('childCounter')
  childCounterChanged(newValue: number, oldValue: number) {
    this.childWatchLog.push(`childCounterChanged:${oldValue}->${newValue}`);
    this.childWatchCallCount++;
    
    // Reactive chain: trigger childChainTriggered
    if (newValue > 0) {
      this.childChainTriggered = true;
    }
  }
  
  // Override base watch handler - child version takes precedence
  @Watch('overrideProp')
  overridePropChanged(newValue: string, oldValue: string) {
    this.childWatchLog.push(`overridePropChanged:child:${oldValue}->${newValue}`);
    this.childWatchCallCount++;
    // Note: base handler should NOT be called - this is override behavior
  }
  
  // Also watch baseProp in child (multiple @Watch decorators for same property at different levels)
  @Watch('baseProp')
  childBasePropChanged(newValue: string, oldValue: string) {
    this.childWatchLog.push(`childBasePropChanged:${oldValue}->${newValue}`);
    this.childWatchCallCount++;
    // This should execute AFTER base handler (execution order test)
  }
  
  // Methods to trigger property changes for testing
  @Method()
  async updateBaseProp(value: string) {
    this.baseProp = value;
  }
  
  @Method()
  async updateBaseCount(value: number) {
    this.baseCount = value;
  }
  
  @Method()
  async updateBaseState(value: string) {
    this.baseState = value;
  }
  
  @Method()
  async updateBaseCounter(value: number) {
    this.baseCounter = value;
  }
  
  @Method()
  async updateOverrideProp(value: string) {
    this.overrideProp = value;
  }
  
  @Method()
  async updateChildProp(value: string) {
    this.childProp = value;
  }
  
  @Method()
  async updateChildCounter(value: number) {
    this.childCounter = value;
  }
  
  @Method()
  async incrementBaseCount() {
    this.baseCount++;
  }
  
  @Method()
  async incrementBaseCounter() {
    this.baseCounter++;
  }
  
  @Method()
  async incrementChildCounter() {
    this.childCounter++;
  }
  
  // Expose base class methods for testing
  getBaseWatchLog(): string[] {
    return super.getWatchLog();
  }
  
  // Get combined watch log
  getCombinedWatchLog(): string[] {
    return [...this.baseWatchLog, ...this.childWatchLog];
  }
  
  // Reset all watch tracking
  @Method()
  async resetWatchLogs() {
    super.resetWatchLog();
    this.childWatchLog = [];
    this.childWatchCallCount = 0;
    this.childChainTriggered = false;
  }
  
  render() {
    const combinedLog = this.getCombinedWatchLog();
    const totalWatchCalls = this.baseWatchCallCount + this.childWatchCallCount;
    
    return (
      <div>
        <h2>Watch Decorator Inheritance Test</h2>
        
        <div class="watch-info">
          <p class="base-watch-count">Base Watch Calls: {this.baseWatchCallCount}</p>
          <p class="child-watch-count">Child Watch Calls: {this.childWatchCallCount}</p>
          <p class="total-watch-count">Total Watch Calls: {totalWatchCalls}</p>
          <p class="watch-log-length">Watch Log Entries: {combinedLog.length}</p>
        </div>
        
        <div class="property-values">
          <h3>Property Values:</h3>
          <p class="base-prop-value">Base Prop: {this.baseProp}</p>
          <p class="base-count-value">Base Count: {this.baseCount}</p>
          <p class="base-state-value">Base State: {this.baseState}</p>
          <p class="base-counter-value">Base Counter: {this.baseCounter}</p>
          <p class="override-prop-value">Override Prop: {this.overrideProp}</p>
          <p class="child-prop-value">Child Prop: {this.childProp}</p>
          <p class="child-state-value">Child State: {this.childState}</p>
          <p class="child-counter-value">Child Counter: {this.childCounter}</p>
        </div>
        
        <div class="reactive-chains">
          <h3>Reactive Chains:</h3>
          <p class="base-chain-triggered">Base Chain Triggered: {this.baseChainTriggered ? 'true' : 'false'}</p>
          <p class="base-chain-count">Base Chain Count: {this.baseChainCount}</p>
          <p class="child-chain-triggered">Child Chain Triggered: {this.childChainTriggered ? 'true' : 'false'}</p>
        </div>
        
        <div class="watch-log">
          <h3>Watch Log:</h3>
          <ul id="watch-log-list">
            {combinedLog.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
        </div>
        
        <div class="controls">
          <h3>Trigger Property Changes:</h3>
          <button class="update-base-prop" onClick={() => this.updateBaseProp('base prop updated')}>
            Update Base Prop
          </button>
          <button class="update-base-count" onClick={() => this.updateBaseCount(5)}>
            Update Base Count
          </button>
          <button class="update-base-state" onClick={() => this.updateBaseState('base state updated')}>
            Update Base State
          </button>
          <button class="update-base-counter" onClick={() => this.updateBaseCounter(10)}>
            Update Base Counter
          </button>
          <button class="update-override-prop" onClick={() => this.updateOverrideProp('override prop updated')}>
            Update Override Prop
          </button>
          <button class="update-child-prop" onClick={() => this.updateChildProp('child prop updated')}>
            Update Child Prop
          </button>
          <button class="update-child-counter" onClick={() => this.updateChildCounter(20)}>
            Update Child Counter
          </button>
          <button class="increment-base-count" onClick={() => this.incrementBaseCount()}>
            Increment Base Count
          </button>
          <button class="increment-base-counter" onClick={() => this.incrementBaseCounter()}>
            Increment Base Counter
          </button>
          <button class="increment-child-counter" onClick={() => this.incrementChildCounter()}>
            Increment Child Counter
          </button>
          <button class="reset-logs" onClick={() => this.resetWatchLogs()}>
            Reset Logs
          </button>
        </div>
        
        <div class="test-info">
          <p>Features: @Watch inheritance | Execution order | Reactive chains | Handler override</p>
        </div>
      </div>
    );
  }
}

