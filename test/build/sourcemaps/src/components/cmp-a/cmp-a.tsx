import { Component, Prop } from '@stencil/core';

import { format } from '../../utils/format';

@Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css', encapsulation: { type: 'shadow' } })
export class CmpA {
  @Prop() label = 'a';

  render() {
    return (
      <div>
        {'marker-cmp-a'}
        {format(this.label)}
        <cmp-b />
      </div>
    );
  }
}
