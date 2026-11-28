import { Component, Prop } from '@stencil/core';

/**
 * A simple text input component.
 */
@Component({
  tag: 'my-input',
  encapsulation: { type: 'shadow' },
})
export class MyInput {
  /**
   * The input's placeholder text.
   */
  @Prop() placeholder = '';

  render() {
    return <input type='text' placeholder={this.placeholder} />;
  }
}
