import { Component, h } from '@stencil/core';

/** Polls with setInterval for something that never happens. */
@Component({ tag: 'poll-forever-cmp', encapsulation: { type: 'shadow' } })
export class PollForeverCmp {
  componentWillLoad() {
    return new Promise<void>(() => {
      setInterval(() => {}, 10);
    });
  }

  render() {
    return <div>poll-forever-cmp</div>;
  }
}
