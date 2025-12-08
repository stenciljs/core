import { Prop, State, Watch } from '@stencil/core';

/**
 * WatchBase - Base class demonstrating @Watch decorator inheritance
 * 
 * This base class provides:
 * 1. @Watch decorators on @Prop properties
 * 2. @Watch decorators on @State properties
 * 3. Watch handlers that track execution order
 * 4. Watch handlers that trigger other property changes (reactive chains)
 * 5. Watch handlers that can be overridden in child classes
 */
export class WatchBase {
  // Base properties with watch decorators
  @Prop() baseProp: string = 'base prop initial';
  @Prop() baseCount: number = 0;
  @State() baseState: string = 'base state initial';
  @State() baseCounter: number = 0;
  
  // Properties used for reactive chains (watch handlers trigger changes to these)
  @State() baseChainTriggered: boolean = false;
  @State() baseChainCount: number = 0;
  
  // Track watch handler execution for testing
  @State() baseWatchLog: string[] = [];
  @State() baseWatchCallCount: number = 0;
  
  // Watch baseProp - inherited by child, can be overridden
  @Watch('baseProp')
  basePropChanged(newValue: string, oldValue: string) {
    this.baseWatchLog.push(`basePropChanged:${oldValue}->${newValue}`);
    this.baseWatchCallCount++;
    
    // Reactive chain: trigger change to baseState
    this.baseState = `state updated by baseProp: ${newValue}`;
  }
  
  // Watch baseCount - inherited by child
  @Watch('baseCount')
  baseCountChanged(newValue: number, oldValue: number) {
    this.baseWatchLog.push(`baseCountChanged:${oldValue}->${newValue}`);
    this.baseWatchCallCount++;
    
    // Reactive chain: increment baseChainCount
    this.baseChainCount = newValue * 2;
  }
  
  // Watch baseState - inherited by child, can be overridden
  @Watch('baseState')
  baseStateChanged(newValue: string, oldValue: string) {
    this.baseWatchLog.push(`baseStateChanged:${oldValue}->${newValue}`);
    this.baseWatchCallCount++;
  }
  
  // Watch baseCounter - inherited by child
  @Watch('baseCounter')
  baseCounterChanged(newValue: number, oldValue: number) {
    this.baseWatchLog.push(`baseCounterChanged:${oldValue}->${newValue}`);
    this.baseWatchCallCount++;
    
    // Reactive chain: set baseChainTriggered flag
    if (newValue > 0) {
      this.baseChainTriggered = true;
    }
  }
  
  // Property that can be watched by both base and child (override scenario)
  @Prop() overrideProp: string = 'override prop initial';
  
  // Watch overrideProp - can be overridden in child class
  @Watch('overrideProp')
  overridePropChanged(newValue: string, oldValue: string) {
    this.baseWatchLog.push(`overridePropChanged:base:${oldValue}->${newValue}`);
    this.baseWatchCallCount++;
  }
  
  // Helper method to get watch log
  getWatchLog(): string[] {
    return [...this.baseWatchLog];
  }
  
  // Helper method to reset watch tracking
  resetWatchLog() {
    this.baseWatchLog = [];
    this.baseWatchCallCount = 0;
    this.baseChainTriggered = false;
    this.baseChainCount = 0;
  }
}

