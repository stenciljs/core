import { Component, h } from '@stencil/core';

import { printLifecycle } from '../../global/util.js';

@Component({
  tag: 'cmp-a',
  styleUrl: 'cmp-a.css',
})
export class CmpA {
  componentWillLoad() {
    printLifecycle('CmpA', 'componentWillLoad');
  }

  componentDidLoad() {
    printLifecycle('CmpA', 'componentDidLoad');
  }

  render() {
    return (
      <div>
        <div>CmpA</div>
        <cmp-b />
        <slot />
      </div>
    );
  }
}
