import {
  mockBuildCtx,
  mockCompilerCtx,
  mockCompilerSystem,
  mockValidatedConfig,
} from '@stencil/core/testing';
import { afterEach, describe, expect, it, MockInstance, vi } from 'vitest';
import type * as d from '@stencil/core';

import { LOADER_BUNDLE, resolve } from '../../../utils';
import { validateLoaderBundle } from '../../config/outputs/validate-loader-bundle';
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
        type: LOADER_BUNDLE,
        dir: 'my-test-dir',
        cjs: true,
        skipInDev: false,
      },
    ],
    srcDir: '/src',
    sys,
  });

  config.outputTargets = validateLoaderBundle(config, config.outputTargets);

  const compilerCtx = mockCompilerCtx(config);
  const writeFileSpy = vi.spyOn(compilerCtx.fs, 'writeFile');
  const buildCtx = mockBuildCtx(config, compilerCtx);

  return { config, compilerCtx, buildCtx, writeFileSpy };
}

describe('Lazy Loader Output Target', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let writeFileSpy: MockInstance;

  afterEach(() => {
    writeFileSpy.mockRestore();
  });

  it('should write loader entry files', async () => {
    ({ config, compilerCtx, writeFileSpy } = setup());
    await outputLazyLoader(config, compilerCtx);

    // Loader defaults to dist/loader, so paths are relative from there to my-test-dir/esm
    const expectedIndexOutput = `export * from '../../my-test-dir/esm/loader.js';`;
    expect(writeFileSpy).toHaveBeenCalledWith(
      resolve('/dist/loader/index.js'),
      expectedIndexOutput,
    );

    const expectedCjsIndexOutput = `module.exports = require('../../my-test-dir/cjs/loader.cjs.js');`;
    expect(writeFileSpy).toHaveBeenCalledWith(
      resolve('/dist/loader/index.cjs.js'),
      expectedCjsIndexOutput,
    );
  });
});
