import { join } from 'path';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type * as d from '@stencil/core';

import { DIST_LAZY } from '../../../../utils';
import * as optimizeModuleMod from '../../../optimize/optimize-module';
import { generateEsmBrowser } from '../generate-esm-browser';

describe('generateEsmBrowser', () => {
  let optimizeModuleSpy: ReturnType<typeof vi.spyOn>;
  let mockRolldownBuild: any;

  beforeEach(() => {
    mockRolldownBuild = {
      generate: vi.fn().mockResolvedValue({
        output: [
          {
            type: 'chunk',
            fileName: 'testapp.js',
            name: 'testapp',
            code: 'export const testapp = true;',
            modules: {},
            imports: [],
            isEntry: true,
            map: null,
          },
          {
            type: 'chunk',
            fileName: 'index.js',
            name: 'index',
            code: 'export const setupApp = () => {};',
            modules: {},
            imports: [],
            isEntry: true,
            map: null,
          },
        ],
      }),
    };

    optimizeModuleSpy = vi.spyOn(optimizeModuleMod, 'optimizeModule').mockImplementation(
      async (_config, _compilerCtx, opts) =>
        ({
          output: opts.input,
          diagnostics: [],
          sourceMap: undefined,
        }) as any,
    );
  });

  afterEach(() => {
    optimizeModuleSpy.mockRestore();
  });

  it('writes NAMESPACE.esm.js and index.esm.js forwarding modules for CDN consumers', async () => {
    const config = mockValidatedConfig({ fsNamespace: 'testapp' });
    const compilerCtx = mockCompilerCtx(config);
    vi.spyOn(compilerCtx.fs, 'writeFile');
    const buildCtx = mockBuildCtx(config, compilerCtx);
    const esmDir = join(config.rootDir, 'dist', 'lazy', 'testapp');

    const outputTargets: d.OutputTargetDistLazy[] = [
      { type: DIST_LAZY, esmDir, isBrowserBuild: true },
    ];

    await generateEsmBrowser(config, compilerCtx, buildCtx, mockRolldownBuild, outputTargets);

    expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
      join(esmDir, 'testapp.esm.js'),
      `import './testapp.js';\nexport * from './testapp.js';\n`,
      expect.anything(),
    );
    expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
      join(esmDir, 'index.esm.js'),
      `import './index.js';\nexport * from './index.js';\n`,
      expect.anything(),
    );
  });
});
