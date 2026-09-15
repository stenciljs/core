import { Component, Prop, State } from '@stencil/core';
import { Effect } from '@stencil/core/signals';

@Component({
  tag: 'signal-ssr-cmp',
  encapsulation: { type: 'shadow' },
})
export class SignalSsrCmp {
  @Prop({ reflect: true }) initialCount = 0;
  @State() count = 0;

  @Effect() log() {
    console.log(this.initialCount, this.count);
  }

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
