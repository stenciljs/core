import { Component, Element, h } from '@stencil/core';

import output from './output';

const LOG_ID = 'connected-callback-race-shadow-log';

@Component({
  tag: 'connected-callback-race-shadow-parent',
  encapsulation: { type: 'shadow' },
})
export class ConnectedCallbackRaceShadowParent {
  @Element() el!: HTMLElement;

  connectedCallback() {
    output('shadow-parent-connectedCallback', LOG_ID);
  }

  componentWillLoad() {
    const sawChild =
      this.el
        .querySelector('connected-callback-race-shadow-child')
        ?.hasAttribute('data-connected') ?? false;
    output(`shadow-parent-componentWillLoad saw-child=${sawChild}`, LOG_ID);
  }

  render() {
    return <slot />;
  }
}
