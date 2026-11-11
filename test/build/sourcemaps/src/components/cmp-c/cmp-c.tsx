import { Component, Prop } from '@stencil/core';

import { format } from '../../utils/format';

@Component({ tag: 'cmp-c', encapsulation: { type: 'shadow' } })
export class CmpC {
  @Prop() label = 'c';

  render() {
    return (
      <p>
        {'marker-cmp-c'}
        {format(this.label)}
      </p>
    );
  }
}
