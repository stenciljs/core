import { Component, Method, Prop, State } from '@stencil/core';
import { Effect } from '@stencil/core/signals';

@Component({ tag: 'signal-effect-cmp' })
export class SignalEffectCmp {
  @State() count = 0;
  @State() other = 0;
  @Prop() multiplier = 1;

  private effectLog: number[] = [];
  private propEffectLog: number[] = [];

  @Effect()
  trackCount() {
    this.effectLog.push(this.count);
  }

  @Effect()
  trackMultiplied() {
    this.propEffectLog.push(this.count * this.multiplier);
  }

  @Method() async increment() {
    this.count++;
  }
  @Method() async bumpOther() {
    this.other++;
  }
  @Method() async getEffectLog() {
    return [...this.effectLog];
  }
  @Method() async getPropEffectLog() {
    return [...this.propEffectLog];
  }

  render() {
    return (
      <div>
        <span class='count'>{this.count}</span>
        <span class='other'>{this.other}</span>
      </div>
    );
  }
}
