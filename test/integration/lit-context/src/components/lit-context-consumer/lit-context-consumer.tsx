import { ContextConsumer } from '@lit/context';
import { Component, Mixin, ReactiveControllerHost, State } from '@stencil/core';

import { greetingContext } from '../../lit-context.js';

@Component({ tag: 'lit-context-consumer' })
export class LitContextConsumer extends Mixin(ReactiveControllerHost) {
  @State() value?: string;

  private consumer = new ContextConsumer(this, {
    context: greetingContext,
    callback: (value) => {
      this.value = value;
    },
  });

  render() {
    return <div class='value'>{this.value ?? 'no value'}</div>;
  }
}
