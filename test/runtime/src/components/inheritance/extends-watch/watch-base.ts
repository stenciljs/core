import { Prop, State, Watch } from '@stencil/core';

/**
 * WatchBase - Base class demonstrating @Watch decorator inheritance
 */
export class WatchBase {
  @Prop() baseProp: string = 'base prop initial';
  @Prop() baseCount: number = 0;
  @State() baseState: string = 'base state initial';
  @State() baseCounter: number = 0;

  @State() baseChainTriggered: boolean = false;
  @State() baseChainCount: number = 0;

  @State() baseWatchLog: string[] = [];
  @State() baseWatchCallCount: number = 0;

  @Watch('baseProp')
  basePropChanged(newValue: string, oldValue: string) {
    this.baseWatchLog = [...this.baseWatchLog, `basePropChanged:${oldValue}->${newValue}`];
    this.baseWatchCallCount++;
    this.baseState = `state updated by baseProp: ${newValue}`;
  }

  @Watch('baseCount')
  baseCountChanged(newValue: number, oldValue: number) {
    this.baseWatchLog = [...this.baseWatchLog, `baseCountChanged:${oldValue}->${newValue}`];
    this.baseWatchCallCount++;
    this.baseChainCount = newValue * 2;
  }

  @Watch('baseState')
  baseStateChanged(newValue: string, oldValue: string) {
    this.baseWatchLog = [...this.baseWatchLog, `baseStateChanged:${oldValue}->${newValue}`];
    this.baseWatchCallCount++;
  }

  @Watch('baseCounter')
  baseCounterChanged(newValue: number, oldValue: number) {
    this.baseWatchLog = [...this.baseWatchLog, `baseCounterChanged:${oldValue}->${newValue}`];
    this.baseWatchCallCount++;
    if (newValue > 0) {
      this.baseChainTriggered = true;
    }
  }

  @Prop() overrideProp: string = 'override prop initial';

  @Watch('overrideProp')
  overridePropChanged(newValue: string, oldValue: string) {
    this.baseWatchLog = [...this.baseWatchLog, `overridePropChanged:base:${oldValue}->${newValue}`];
    this.baseWatchCallCount++;
  }

  getWatchLog(): string[] {
    return [...this.baseWatchLog];
  }

  resetWatchLog() {
    this.baseWatchLog = [];
    this.baseWatchCallCount = 0;
    this.baseChainTriggered = false;
    this.baseChainCount = 0;
  }
}
