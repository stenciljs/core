import { Component, Element } from '@stencil/core';

import output from './output';

@Component({
  tag: 'connected-callback-race-parent',
})
export class ConnectedCallbackRaceParent {
  @Element() el!: HTMLElement;

  connectedCallback() {
    output('parent-connectedCallback');
  }

  componentWillLoad() {
    const sawChild =
      this.el.querySelector('connected-callback-race-child')?.hasAttribute('data-connected') ??
      false;
    output(`parent-componentWillLoad saw-child=${sawChild}`);
  }

  render() {
    return 'parent';
  }
}
