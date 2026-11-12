import * as d from '@stencil/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { generateHmr } from '../build-hmr';

describe('generateHmr', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  beforeEach(() => {
    config = mockValidatedConfig();
    config.devServer = { reloadStrategy: 'hmr' } as d.DevServerConfig;
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
    buildCtx.isRebuild = true;
  });

  it('includes globalStylesUpdated when a global-style output target changed', () => {
    buildCtx.globalStylesUpdated = [{ fileName: 'app.css', styleText: 'body { color: red; }' }];

    const hmr = generateHmr(config, compilerCtx, buildCtx);

    expect(hmr?.globalStylesUpdated).toEqual([
      { fileName: 'app.css', styleText: 'body { color: red; }' },
    ]);
  });

  it('omits globalStylesUpdated when nothing changed', () => {
    const hmr = generateHmr(config, compilerCtx, buildCtx);

    expect(hmr?.globalStylesUpdated).toBeUndefined();
  });

  it('reports externalStylesUpdated for written css files even without a www output target', () => {
    config.outputTargets = [];
    buildCtx.filesWritten = ['/dist/assets/other.css'];

    const hmr = generateHmr(config, compilerCtx, buildCtx);

    expect(hmr?.externalStylesUpdated).toEqual(['other.css']);
  });

  it('excludes global-style output filenames from externalStylesUpdated', () => {
    config.outputTargets = [
      {
        type: 'global-style',
        input: '/src/app.css',
        fileName: 'app.css',
      } as d.OutputTargetGlobalStyle,
    ];
    buildCtx.filesWritten = ['/dist/assets/app.css', '/dist/assets/other.css'];

    const hmr = generateHmr(config, compilerCtx, buildCtx);

    expect(hmr?.externalStylesUpdated).toEqual(['other.css']);
  });
});
