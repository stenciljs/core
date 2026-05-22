import { Component, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'signal-ssr-cmp',
  encapsulation: { type: 'shadow' },
})
export class SignalSsrCmp {
  @Prop() initialCount = 0;
  @State() count = 0;

  componentWillLoad() {
    this.count = this.initialCount;
  }

  render() {
    return (
      <div>
        <span class='count'>{this.count}</span>
        <button class='inc' onClick={() => this.count++}>
          +
        </button>
        <button class='dec' onClick={() => this.count--}>
          -
        </button>
      </div>
    );
  }
}
