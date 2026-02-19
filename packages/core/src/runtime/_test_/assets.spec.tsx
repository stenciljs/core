import { expect, describe, it, beforeEach } from '@stencil/vitest'
import { getAssetPath, setAssetPath } from '@stencil/core';
import { newSpecPage } from '../../testing/spec-page';
import { CmpAsset } from './fixtures/cmp-asset';

describe('assets', () => {
  beforeEach(() => {
    setAssetPath('http://localhost:3000/');
  });

  it('should load asset data', async () => {
    const page = await newSpecPage({
      components: [CmpAsset],
      html: `<cmp-asset icon="delorean"></cmp-asset>`,
    });

    console.log(window.location);

    expect(page.root).toEqualHtml(`
      <cmp-asset icon="delorean">
        <img src="http://localhost:3000/assets/icons/delorean.png">
        <img src="https://google.com/">
      </cmp-asset>
    `);
  });

  it('getAssetPath is defined', async () => {
    expect(getAssetPath).toBeDefined();
  });
});
