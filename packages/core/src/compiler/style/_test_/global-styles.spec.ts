import * as d from '@stencil/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { buildGlobalStyleFromInput } from '../global-styles';

describe('buildGlobalStyleFromInput', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;
  const inputPath = '/src/global.css';

  beforeEach(async () => {
    config = mockValidatedConfig();
    config.devServer = { reloadStrategy: 'hmr' } as d.DevServerConfig;
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
    await compilerCtx.fs.writeFile(inputPath, 'body { color: red; }');
  });

  it('pushes a fileName-keyed HMR update for an explicit `input` output target on rebuild', async () => {
    config.outputTargets = [
      {
        type: 'global-style',
        input: inputPath,
        fileName: 'theme.css',
      } as d.OutputTargetGlobalStyle,
    ];
    buildCtx.isRebuild = true;
    buildCtx.filesChanged = [inputPath];

    await buildGlobalStyleFromInput(config, compilerCtx, buildCtx, inputPath);

    expect(buildCtx.globalStylesUpdated.length).toBe(1);
    expect(buildCtx.globalStylesUpdated[0].fileName).toBe('theme.css');
    expect(buildCtx.globalStylesUpdated[0].styleText).toContain('color: red');
  });

  it('does not push an HMR update on the initial (non-rebuild) build', async () => {
    config.outputTargets = [
      {
        type: 'global-style',
        input: inputPath,
        fileName: 'theme.css',
      } as d.OutputTargetGlobalStyle,
    ];
    buildCtx.isRebuild = false;

    await buildGlobalStyleFromInput(config, compilerCtx, buildCtx, inputPath);

    expect(buildCtx.globalStylesUpdated).toEqual([]);
  });

  it('pushes one update per matching output target when multiple share the same input', async () => {
    config.outputTargets = [
      { type: 'global-style', input: inputPath, fileName: 'a.css' } as d.OutputTargetGlobalStyle,
      { type: 'global-style', input: inputPath, fileName: 'b.css' } as d.OutputTargetGlobalStyle,
    ];
    buildCtx.isRebuild = true;
    buildCtx.filesChanged = [inputPath];

    await buildGlobalStyleFromInput(config, compilerCtx, buildCtx, inputPath);

    expect(buildCtx.globalStylesUpdated.map((u) => u.fileName).sort()).toEqual(['a.css', 'b.css']);
  });

  it('upserts rather than duplicating when called more than once for the same target in a build', async () => {
    config.outputTargets = [
      {
        type: 'global-style',
        input: inputPath,
        fileName: 'theme.css',
      } as d.OutputTargetGlobalStyle,
    ];
    buildCtx.isRebuild = true;
    buildCtx.filesChanged = [inputPath];

    await buildGlobalStyleFromInput(config, compilerCtx, buildCtx, inputPath);
    await buildGlobalStyleFromInput(config, compilerCtx, buildCtx, inputPath);

    expect(buildCtx.globalStylesUpdated.length).toBe(1);
  });
});
