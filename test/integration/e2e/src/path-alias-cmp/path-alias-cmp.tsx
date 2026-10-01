import { sayHi } from '@path-alias';
import { Component } from '@stencil/core';

@Component({
  tag: 'path-alias-cmp',
})
export class PathAliasCmp {
  render() {
    return <h1>{sayHi()}</h1>;
  }
}
