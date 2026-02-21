import { Component, h } from '@stencil/core';

import { printLifecycle } from '../../global/util.js';

@Component({
  tag: 'cmp-c',
  styleUrl: 'cmp-c.css',
})
export class CmpC {
  componentWillLoad() {
    printLifecycle('CmpC', 'componentWillLoad');
  }

  componentDidLoad() {
    printLifecycle('CmpC', 'componentDidLoad');
  }

  render() {
    return (
      <div>
        <div>CmpC</div>
        <cmp-d uniqueId="c-child" />
      </div>
    );
  }
}
