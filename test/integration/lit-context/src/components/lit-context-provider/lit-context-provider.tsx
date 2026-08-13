import { ContextProvider } from '@lit/context';
import { Component, Host, Mixin, ReactiveControllerHost } from '@stencil/core';

import { greetingContext } from '../../lit-context.js';

@Component({ tag: 'lit-context-provider' })
export class LitContextProvider extends Mixin(ReactiveControllerHost) {
  private provider = new ContextProvider(this, {
    context: greetingContext,
    initialValue: 'hello from provider',
  });

  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
