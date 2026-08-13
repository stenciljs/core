import { ContextProvider } from '@lit/context';
import { Component, Host, Mixin, ReactiveControllerHost, Element } from '@stencil/core';

import { greetingContext } from '../../lit-context.js';

@Component({ tag: 'lit-context-provider' })
export class LitContextProvider extends Mixin(ReactiveControllerHost) {
  @Element() host!: typeof this;
  private provider?: ContextProvider<typeof greetingContext>;

  connectedCallback() {
    super.connectedCallback?.();
    // constructed here, not as a field initializer: the real host element (with
    // addController/etc. bridged onto it) is only available once connected - see
    // reactive-controller.ts's connectedCallback for why.
    this.provider ??= new ContextProvider(this.host, {
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
