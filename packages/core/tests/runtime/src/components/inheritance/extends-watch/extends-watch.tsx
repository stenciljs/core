import { Component, Element, h, Method, Prop, State, Watch } from '@stencil/core';
import { WatchBase } from './watch-base.js';

@Component({
  tag: 'extends-watch',
})
export class ExtendsWatch extends WatchBase {
  @Element() el!: HTMLElement;

  @Prop() childProp: string = 'child prop initial';
  @State() childState: string = 'child state initial';
  @State() childCounter: number = 0;

  @State() childWatchLog: string[] = [];
  @State() childWatchCallCount: number = 0;
  @State() childChainTriggered: boolean = false;

  @Watch('childProp')
  childPropChanged(newValue: string, oldValue: string) {
    this.childWatchLog = [...this.childWatchLog, `childPropChanged:${oldValue}->${newValue}`];
    this.childWatchCallCount++;
    this.childState = `state updated by childProp: ${newValue}`;
  }

  @Watch('childState')
  childStateChanged(newValue: string, oldValue: string) {
    this.childWatchLog = [...this.childWatchLog, `childStateChanged:${oldValue}->${newValue}`];
    this.childWatchCallCount++;
  }

  @Watch('childCounter')
  childCounterChanged(newValue: number, oldValue: number) {
    this.childWatchLog = [...this.childWatchLog, `childCounterChanged:${oldValue}->${newValue}`];
    this.childWatchCallCount++;
    if (newValue > 0) {
      this.childChainTriggered = true;
    }
  }

  @Watch('overrideProp')
  overridePropChanged(newValue: string, oldValue: string) {
    this.childWatchLog = [...this.childWatchLog, `overridePropChanged:child:${oldValue}->${newValue}`];
    this.childWatchCallCount++;
  }

  @Watch('baseProp')
  childBasePropChanged(newValue: string, oldValue: string) {
    this.childWatchLog = [...this.childWatchLog, `childBasePropChanged:${oldValue}->${newValue}`];
    this.childWatchCallCount++;
  }

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
  async resetWatchLogs() {
    super.resetWatchLog();
    this.childWatchLog = [];
    this.childWatchCallCount = 0;
    this.childChainTriggered = false;
  }

  getCombinedWatchLog(): string[] {
    return [...this.baseWatchLog, ...this.childWatchLog];
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
        </div>

        <div class="property-values">
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
          <p class="base-chain-triggered">Base Chain Triggered: {this.baseChainTriggered ? 'true' : 'false'}</p>
          <p class="base-chain-count">Base Chain Count: {this.baseChainCount}</p>
          <p class="child-chain-triggered">Child Chain Triggered: {this.childChainTriggered ? 'true' : 'false'}</p>
        </div>

        <div class="watch-log">
          <ul id="watch-log-list">
            {combinedLog.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}
