import { EnvData } from './env-data';
import { newSpecPage } from '@stencil/core/testing';

describe('env-data', () => {
  it('should be a test', async () => {
    const { root } = await newSpecPage({
      components: [EnvData],
      html: `<env-data></env-data>`,
    });
    expect(root).toEqualHtml(`
      <env-data>
        <p>foo: bar</p>
        <p>HOST: example.com</p>
      </env-data>
    `);
  });
});
