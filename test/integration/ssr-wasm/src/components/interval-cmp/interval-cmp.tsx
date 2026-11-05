import { Component, State, h } from '@stencil/core';

/** Counts three setInterval ticks in componentWillLoad, then clears the interval. */
@Component({ tag: 'interval-cmp', encapsulation: { type: 'shadow' } })
export class IntervalCmp {
  @State() ticks = 0;

  componentWillLoad() {
    return new Promise<void>((resolve) => {
      const id = setInterval(() => {
        this.ticks++;
        if (this.ticks === 3) {
          clearInterval(id);
          resolve();
        }
      }, 10);
    });
  }

  render() {
    return <div>ticks: {this.ticks}</div>;
  }
}
