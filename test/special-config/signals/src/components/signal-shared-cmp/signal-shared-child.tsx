import { Component } from '@stencil/core';

import { sharedCount, sharedLabel } from '../../shared-signals';

@Component({ tag: 'signal-shared-child' })
export class SignalSharedChild {
  render() {
    return (
      <div>
        <span class='child-count'>{sharedCount}</span>
        <span class='child-label'>{sharedLabel}</span>
      </div>
    );
  }
}
