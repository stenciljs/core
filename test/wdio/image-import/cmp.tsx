import { Component, h } from '@stencil/core';

import stencilLogo from './stencil-logo.svg';

@Component({
  tag: 'image-import',
})
export class ImageImport {
  render() {
    return (
      <div>
        <img src={stencilLogo} />
      </div>
    );
  }
}
