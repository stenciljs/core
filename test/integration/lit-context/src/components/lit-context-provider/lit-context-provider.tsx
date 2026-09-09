import { ContextProvider } from '@lit/context';
import { Component, getElement, Host, Mixin, ReactiveControllerHost } from '@stencil/core';

import { greetingContext } from '../../lit-context.js';

@Component({ tag: 'lit-context-provider' })
export class LitContextProvider extends Mixin(ReactiveControllerHost) {
  private provider?: ContextProvider<typeof greetingContext>;

  connectedCallback() {
    super.connectedCallback?.();
    // constructed here, not as a field initializer: the real host element (with
    // addController/etc. bridged onto it) is only available once connected - see
    // reactive-controller.ts's connectedCallback for why.
    this.provider ??= new ContextProvider(getElement(this), {
      context: greetingContext,
      initialValue: 'hello from provider',
    });
  }

  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
