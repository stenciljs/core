import { Component, h } from '@stencil/core';

import output from './output';

@Component({
  tag: 'lifecycle-nested-b',
  encapsulation: { type: 'shadow' },
})
export class Cmpb {
  async componentWillLoad() {
    output('componentWillLoad-b');
  }

  async componentDidLoad() {
    output('componentDidLoad-b');
  }

  render() {
    return <slot />;
  }
}
