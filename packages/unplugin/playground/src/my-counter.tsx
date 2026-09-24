import { Component, h } from '@stencil/core';

import { count } from './count-signal';

@Component({ tag: 'my-counter', styleUrl: 'my-counter.scss', encapsulation: { type: 'shadow' } })
export class MyCounter {
  render() {
    return (
      <div class='counter'>
        <button class='btn dec' onClick={() => count.value--}>
          −
        </button>
        <span class='value'>{count}</span>
        <button class='btn inc' onClick={() => count.value++}>
          +
        </button>
      </div>
    );
  }
}
