import { Component, Method, State, h } from '@stencil/core';
import { computed } from '@stencil/core/signals';

@Component({ tag: 'signal-computed-cmp' })
export class SignalComputedCmp {
  @State() count = 0;

  doubled = computed(() => this.count * 2);

  @Method() async setCount(n: number) {
    this.count = n;
  }

  render() {
    return (
      <div>
        <span class='count'>{this.count}</span>
        <span class='doubled'>{this.doubled}</span>
      </div>
    );
  }
}
