import { Component, h } from '@stencil/core';

import { BaseInput } from './docs-shared/base-input.js';

@Component({ tag: 'my-input', encapsulation: { type: 'shadow' } })
export class MyInput extends BaseInput {
  render() {
    return <input />;
  }
}
