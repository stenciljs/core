jest.mock('../../plugin/plugin', () => ({
  runPluginTransforms: jest.fn(),
}));
jest.mock('../optimize-css', () => ({
  optimizeCss: jest.fn(),
}));

import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';

import { runPluginTransforms } from '../../plugin/plugin';
import { generateGlobalStyles } from '../global-styles';
import { optimizeCss } from '../optimize-css';

describe('generateGlobalStyles', () => {
  it('writes an external source map beside the generated global stylesheet', async () => {
    const config = mockValidatedConfig({
      globalStyle: '/src/global.css',
      outputTargets: [{ type: 'dist-global-styles', file: '/dist/global.css' }],
      sourceMapCss: true,
    });
    const compilerCtx = mockCompilerCtx(config);
    const buildCtx = mockBuildCtx(config, compilerCtx);
    const sourceMap = {
      version: 3,
      file: '/src/global.css',
      names: [] as string[],
      mappings: 'AAAA',
      sources: ['/src/global.scss'],
      sourcesContent: ['.button { color: red; }'],
    };

    jest.mocked(runPluginTransforms).mockResolvedValue({
      code: '.button { color: red; }',
      id: '/src/global.css',
      map: undefined,
      dependencies: [],
    });
    jest.mocked(optimizeCss).mockResolvedValue({
      output: '.button{color:red}',
      map: sourceMap,
      diagnostics: [],
    });

    await generateGlobalStyles(config, compilerCtx, buildCtx);

    const css = await compilerCtx.fs.readFile('/dist/global.css');
    const map = await compilerCtx.fs.readFile('/dist/global.css.map');
    expect(css).toContain('sourceMappingURL=global.css.map');
    expect(css).not.toContain('data:application/json');
    expect(JSON.parse(map as string)).toEqual({ ...sourceMap, file: 'global.css' });
  });
});
