import { Component, Element } from '@stencil/core';

import output from './output';

@Component({
  tag: 'connected-callback-race-deferred-parent',
})
export class ConnectedCallbackRaceDeferredParent {
  @Element() el!: HTMLElement;

  connectedCallback() {
    output('deferred-parent-connectedCallback', 'connected-callback-race-deferred-log');
  }

  componentWillLoad() {
    const sawChild =
      this.el
        .querySelector('connected-callback-race-deferred-child')
        ?.hasAttribute('data-connected') ?? false;
    output(
      `deferred-parent-componentWillLoad saw-child=${sawChild}`,
      'connected-callback-race-deferred-log',
    );
  }

  render() {
    return 'deferred-parent';
  }
}
