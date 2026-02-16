import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockCompilerSystem, mockValidatedConfig } from '@stencil/core/testing';
import { DIST, resolve } from '@utils';

import { validateDist } from '../../config/outputs/validate-dist';
import { outputLazyLoader } from '../output-lazy-loader';

function setup(configOverrides: Partial<d.ValidatedConfig> = {}) {
  const sys = mockCompilerSystem();
  const config: d.ValidatedConfig = mockValidatedConfig({
    ...configOverrides,
    configPath: '/testing-path',
    buildAppCore: true,
    namespace: 'TestApp',
    outputTargets: [
      {
        type: DIST,
        dir: 'my-test-dir',
      },
    ],
    srcDir: '/src',
    sys,
  });

  config.outputTargets = validateDist(config, config.outputTargets);

  const compilerCtx = mockCompilerCtx(config);
  const writeFileSpy = jest.spyOn(compilerCtx.fs, 'writeFile');
  const buildCtx = mockBuildCtx(config, compilerCtx);

  return { config, compilerCtx, buildCtx, writeFileSpy };
}

describe('Lazy Loader Output Target', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let writeFileSpy: jest.SpyInstance;

  afterEach(() => {
    writeFileSpy.mockRestore();
  });

  it('should write code for initializing polyfills when buildEs5=true', async () => {
    ({ config, compilerCtx, writeFileSpy } = setup({ buildEs5: true }));
    await outputLazyLoader(config, compilerCtx);

    const expectedIndexOutput = `export * from '../esm/polyfills/index.js';
export * from '../esm-es5/loader.js';`;
    expect(writeFileSpy).toHaveBeenCalledWith(resolve('/my-test-dir/loader/index.js'), expectedIndexOutput);

    const expectedCjsIndexOutput = `module.exports = require('../cjs/loader.cjs.js');
module.exports.applyPolyfills = function() { return Promise.resolve() };`;
    expect(writeFileSpy).toHaveBeenCalledWith(resolve('/my-test-dir/loader/index.cjs.js'), expectedCjsIndexOutput);

    const expectedES2017Output = `export * from '../esm/polyfills/index.js';
export * from '../esm/loader.js';`;
    expect(writeFileSpy).toHaveBeenCalledWith(resolve('/my-test-dir/loader/index.es2017.js'), expectedES2017Output);
  });

  it('should exclude polyfill code when buildEs5=false', async () => {
    ({ config, compilerCtx, writeFileSpy } = setup({ buildEs5: false }));
    await outputLazyLoader(config, compilerCtx);

    const expectedIndexOutput = `export * from '../esm/loader.js';`;
    expect(writeFileSpy).toHaveBeenCalledWith(resolve('/my-test-dir/loader/index.js'), expectedIndexOutput);

    const expectedCjsIndexOutput = `module.exports = require('../cjs/loader.cjs.js');`;
    expect(writeFileSpy).toHaveBeenCalledWith(resolve('/my-test-dir/loader/index.cjs.js'), expectedCjsIndexOutput);

    const expectedES2017Output = `export * from '../esm/loader.js';`;
    expect(writeFileSpy).toHaveBeenCalledWith(resolve('/my-test-dir/loader/index.es2017.js'), expectedES2017Output);
  });
});
