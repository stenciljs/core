import { Build, Component, h } from '@stencil/core';

import { serverOnly } from './server-only';

@Component({ tag: 'my-build-flag', encapsulation: { type: 'shadow' } })
export class MyBuildFlag {
  render() {
    return <span class='mode'>{Build.isServer ? serverOnly() : 'client'}</span>;
  }
}
