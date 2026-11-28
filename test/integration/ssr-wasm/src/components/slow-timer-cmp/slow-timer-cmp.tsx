import { Component, State, h } from '@stencil/core';

/** Waits for a 60 s timer: longer than the default 15 s render timeout. */
@Component({ tag: 'slow-timer-cmp', encapsulation: { type: 'shadow' } })
export class SlowTimerCmp {
  @State() text = 'waiting';

  async componentWillLoad() {
    await new Promise<void>((resolve) => setTimeout(resolve, 60_000));
    this.text = 'done after a minute';
  }

  render() {
    return <div>{this.text}</div>;
  }
}
