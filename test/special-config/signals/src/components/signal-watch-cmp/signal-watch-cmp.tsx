import { Component, Method, State, Watch } from '@stencil/core';

@Component({ tag: 'signal-watch-cmp' })
export class SignalWatchCmp {
  @State() value = 0;

  private history: Array<{ newVal: number; oldVal: number }> = [];

  @Watch('value')
  onValueChange(newVal: number, oldVal: number) {
    this.history.push({ newVal, oldVal });
  }

  @Method() async setValue(n: number) {
    this.value = n;
  }
  @Method() async getHistory() {
    return [...this.history];
  }

  render() {
    return <span class='value'>{this.value}</span>;
  }
}
