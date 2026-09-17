import { Component, Element, h } from '@stencil/core';

import output from './output';

// Non-shadow + its own `<slot>` gives this component `hasSlotRelocation`, which defers
// firing its real `connectedCallback` - see initialize-component.ts. Regression coverage
// for that deferred path specifically, as distinct from `connected-callback-race-child`.
@Component({
  tag: 'connected-callback-race-deferred-child',
})
export class ConnectedCallbackRaceDeferredChild {
  @Element() el!: HTMLElement;

  connectedCallback() {
    this.el.setAttribute('data-connected', '');
    output('deferred-child-connectedCallback', 'connected-callback-race-deferred-log');
  }

  render() {
    return <slot />;
  }
}
