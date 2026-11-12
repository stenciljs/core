import { Component, Element } from '@stencil/core';

import output from './output';

@Component({
  tag: 'connected-callback-race-child',
})
export class ConnectedCallbackRaceChild {
  @Element() el!: HTMLElement;

  connectedCallback() {
    this.el.setAttribute('data-connected', '');
    output('child-connectedCallback');
  }

  render() {
    return 'child';
  }
}
