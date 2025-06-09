import { Component, h } from '@stencil/core';

import { location as module } from './module.js';
import { location as moduleIndex } from './module/index.js';

@Component({
  tag: 'node-resolution',
})
export class NodeResolution {
  render() {
    return (
      <div>
        <h1>node-resolution</h1>
        <p id="module-index">{moduleIndex}</p>
        <p id="module">{module}</p>
      </div>
    );
  }
}
