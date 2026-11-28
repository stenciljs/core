import { Component, State, h } from '@stencil/core';

/** Waits for requestAnimationFrame in componentWillLoad. */
@Component({ tag: 'raf-cmp', encapsulation: { type: 'shadow' } })
export class RafCmp {
  @State() text = 'before frame';

  async componentWillLoad() {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    this.text = 'after frame';
  }

  render() {
    return <div>{this.text}</div>;
  }
}
