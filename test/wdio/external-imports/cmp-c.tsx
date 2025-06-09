import { Component, h } from '@stencil/core';

import { data } from './external-data.js';

@Component({
  tag: 'external-import-c',
})
export class ExternalImportB {
  first?: string;
  last?: string;

  componentWillLoad() {
    this.first = data().first;
    this.last = data().last;
  }

  render() {
    return (
      <div>
        {this.first} {this.last}
      </div>
    );
  }
}
