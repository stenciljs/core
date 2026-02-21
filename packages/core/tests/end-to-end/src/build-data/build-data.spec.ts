import { newSpecPage } from '@stencil/core/testing';

import { BuildData } from './build-data';

describe('build-data', () => {
  it('should be a test', async () => {
    const { root } = await newSpecPage({
      components: [BuildData],
      html: `<build-data></build-data>`,
    });
    expect(root).toEqualHtml(`
      <build-data>
        <p>isDev: true</p>
        <p>isBrowser: false</p>
        <p>isTesting: true</p>
      </build-data>
    `);
  });
});
