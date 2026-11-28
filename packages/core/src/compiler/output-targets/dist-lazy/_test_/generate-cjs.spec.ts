import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type * as d from '@stencil/core';
import type { RolldownBuild } from 'rolldown';

import { mockValidatedConfig } from '../../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../../testing/compiler';
import { DIST_LAZY, join } from '../../../../utils';
import * as bundleAppCoreMod from '../../../app-core/bundle-app-core';
import { generateCjs } from '../generate-cjs';
import * as generateLazyModuleMod from '../generate-lazy-module';

describe('generateCjs', () => {
  const indexResult = {
    type: 'chunk',
    fileName: 'index.cjs',
    entryKey: 'index',
    isIndex: true,
  } as d.RolldownChunkResult;

  beforeEach(() => {
    vi.spyOn(bundleAppCoreMod, 'generateRolldownOutput').mockResolvedValue([indexResult]);
    vi.spyOn(generateLazyModuleMod, 'generateLazyModules').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scopes the cjs dir as commonjs so `.js` chunks load under a `"type": "module"` package', async () => {
    const config = mockValidatedConfig();
    const compilerCtx = mockCompilerCtx(config);
    vi.spyOn(compilerCtx.fs, 'writeFile');
    const buildCtx = mockBuildCtx(config, compilerCtx);
    const cjsDir = join(config.rootDir, 'dist', 'loader-bundle', 'cjs');

    await generateCjs(config, compilerCtx, buildCtx, {} as RolldownBuild, [
      { type: DIST_LAZY, cjsDir },
    ]);

    expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
      join(cjsDir, 'package.json'),
      `{"type":"commonjs"}\n`,
      { outputTargetType: DIST_LAZY },
    );
  });
});
