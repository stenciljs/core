import { ContextConsumer } from '@lit/context';
import {
  Component,
  Element,
  Mixin,
  ReactiveControllerHost,
  ReactiveControllerHostInterface,
  State,
} from '@stencil/core';

import { greetingContext } from '../../lit-context.js';

@Component({ tag: 'lit-context-consumer' })
export class LitContextConsumer extends Mixin(ReactiveControllerHost) {
  @State() value?: string;
  @Element() host!: typeof this;

  private consumer?: ContextConsumer<typeof greetingContext, ReactiveControllerHostInterface>;

  connectedCallback() {
    super.connectedCallback?.();
    // constructed here, not as a field initializer: the real host element (with
    // addController/etc. bridged onto it) is only available once connected - see
    // reactive-controller.ts's connectedCallback for why.
    this.consumer ??= new ContextConsumer(this.host, {
      context: greetingContext,
      callback: (value) => {
        this.value = value;
      },
    });
  }

  render() {
    return <div class='value'>{this.value ?? 'no value'}</div>;
  }
}
