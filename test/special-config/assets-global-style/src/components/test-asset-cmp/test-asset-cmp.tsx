import { Component, getAssetPath } from '@stencil/core';

@Component({
  tag: 'test-asset-cmp',
  assetsDirs: ['assets'],
})
export class TestAssetCmp {
  render() {
    const path = getAssetPath('./assets/test-file.txt');
    return (
      <div>
        <p>Test Asset Component</p>
        <p class='assets-path'>Asset path: {path}</p>
      </div>
    );
  }
}
