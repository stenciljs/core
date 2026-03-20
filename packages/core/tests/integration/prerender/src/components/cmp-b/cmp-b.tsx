import { Component, h } from '@stencil/core';

import { printLifecycle } from '../../global/util.js';

@Component({
  tag: 'cmp-b',
  styleUrl: 'cmp-b.css',
})
export class CmpB {
  componentWillLoad() {
    printLifecycle('CmpB', 'componentWillLoad');
  }

  componentDidLoad() {
    printLifecycle('CmpB', 'componentDidLoad');
  }

  render() {
    return (
      <div>
        <div>CmpB</div>
        <cmp-c />
      </div>
    );
  }
}
