// The compiler build emits this external bundle at `sys/node/autoprefixer.js`; unit tests run before that build step.
jest.mock(
  '../../sys/node/autoprefixer.js',
  () => ({
    postcss: require('postcss'),
    autoprefixer: require('autoprefixer'),
  }),
  { virtual: true },
);

import { optimizeCss } from '../optimize-css';

describe('optimizeCss source maps', () => {
  it('returns a PostCSS source map when autoprefixing CSS', async () => {
    const result = await optimizeCss({
      input: '.button { box-shadow: 1px 1px; }',
      filePath: '/src/button.css',
      autoprefixer: true,
      minify: false,
      sourceMap: true,
    });

    expect(result.output).toContain('-webkit-box');
    expect(result.map).toEqual(
      expect.objectContaining({
        version: 3,
        sources: ['/src/button.css'],
      }),
    );
  });

  it('composes a plugin source map through CSS minification', async () => {
    const result = await optimizeCss({
      input: '.button { color: red; }',
      filePath: '/src/button.css',
      autoprefixer: false,
      minify: true,
      sourceMap: true,
      map: {
        version: 3,
        file: '/src/button.css',
        names: [],
        mappings: 'AAAA',
        sources: ['/src/button.scss'],
        sourcesContent: ['.button { color: red; }'],
      },
    } as any);

    expect(result.output).toBe('.button{color:red}');
    expect(result.map).toEqual(
      expect.objectContaining({
        version: 3,
        sources: expect.arrayContaining(['/src/button.scss']),
      }),
    );
  });
});
