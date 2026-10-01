import { Component, Method, State } from '@stencil/core';

@Component({ tag: 'signal-counter' })
export class SignalCounter {
  @State() count = 0;

  private renderCount = 0;

  @Method() async increment() {
    this.count++;
  }
  @Method() async decrement() {
    this.count--;
  }
  @Method() async reset() {
    this.count = 0;
  }
  @Method() async getRenderCount() {
    return this.renderCount;
  }

  render() {
    this.renderCount++;
    return <span class='count'>{this.count}</span>;
  }
}
