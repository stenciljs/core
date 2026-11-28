import { Component, State, h } from '@stencil/core';

/** Waits for a setTimeout in componentWillLoad. */
@Component({ tag: 'timer-cmp', encapsulation: { type: 'shadow' } })
export class TimerCmp {
  @State() text = 'before timer';

  async componentWillLoad() {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    this.text = 'after timer';
  }

  render() {
    return <div>{this.text}</div>;
  }
}
