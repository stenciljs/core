import { Component, h, Prop } from '@stencil/core';

import { printLifecycle } from '../../global/util.js';

@Component({
  tag: 'cmp-d',
  styleUrl: 'cmp-d.css',
})
export class CmpD {
  @Prop() uniqueId: string = '';

  componentWillLoad() {
    printLifecycle(`CmpD - ${this.uniqueId}`, 'componentWillLoad');
  }

  componentDidLoad() {
    printLifecycle(`CmpD - ${this.uniqueId}`, 'componentDidLoad');
  }

  render() {
    return <div>CmpD</div>;
  }
}
