import { getAssetPath } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { CmpAsset } from './fixtures/cmp-asset';

describe('assets', () => {
  it('should load asset data', async () => {
    const page = await newSpecPage({
      components: [CmpAsset],
      html: `<cmp-asset icon="delorean"></cmp-asset>`,
    });

    expect(page.root).toEqualHtml(`
      <cmp-asset icon="delorean">
        <img src="/assets/icons/delorean.png">
        <img src="https://google.com/">
      </cmp-asset>
    `);
  });

  it('getAssetPath is defined', async () => {
    expect(getAssetPath).toBeDefined();
  });
});
