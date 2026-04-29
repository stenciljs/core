import { Component, h, getAssetPath } from '@stencil/core';

@Component({
  tag: 'test-asset-cmp',
  assetsDirs: ['assets'],
})
export class TestAssetCmp {
  render() {
    return (
      <div>
        <p>Test Asset Component</p>
        <p>Asset path: {getAssetPath('./test-file.txt')}</p>
      </div>
    );
  }
}
