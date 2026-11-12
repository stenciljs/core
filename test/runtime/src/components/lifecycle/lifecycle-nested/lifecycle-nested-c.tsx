import { Component, Host } from '@stencil/core';

import output from './output';

@Component({
  tag: 'lifecycle-nested-c',
  encapsulation: { type: 'shadow' },
})
export class Cmpc {
  async componentWillLoad() {
    output('componentWillLoad-c');
  }

  componentDidLoad() {
    output('componentDidLoad-c');
  }

  render() {
    return (
      <Host>
        <div>hello</div>
      </Host>
    );
  }
}
