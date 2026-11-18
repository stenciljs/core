import { Component, Element } from '@stencil/core';

import output from './output';

@Component({
  tag: 'connected-callback-race-shadow-child',
})
export class ConnectedCallbackRaceShadowChild {
  @Element() el!: HTMLElement;

  connectedCallback() {
    this.el.setAttribute('data-connected', '');
    output('shadow-child-connectedCallback', 'connected-callback-race-shadow-log');
  }

  render() {
    return 'shadow-child';
  }
}
