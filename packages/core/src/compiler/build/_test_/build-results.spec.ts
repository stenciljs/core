import * as d from '@stencil/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { generateBuildResults } from '../build-results';

describe('generateBuildResults', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  beforeEach(() => {
    config = mockValidatedConfig();
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
  });

  it('returns an empty globalStyleFiles list when no global-style outputs are configured', () => {
    config.outputTargets = [];

    const results = generateBuildResults(config, compilerCtx, buildCtx);

    expect(results.globalStyleFiles).toEqual([]);
  });

  it('lists global-style files in the same order the output targets are declared, not alphabetically', () => {
    // "z.css" declared first, "a.css" second - alphabetical sort would flip this order,
    // but cascade order between global stylesheets is meaningful and must be preserved.
    config.outputTargets = [
      {
        type: 'global-style',
        input: '/src/z.css',
        fileName: 'z.css',
        dir: '/dist/assets',
      } as d.OutputTargetGlobalStyle,
      {
        type: 'global-style',
        input: '/src/a.css',
        fileName: 'a.css',
        dir: '/dist/assets',
      } as d.OutputTargetGlobalStyle,
    ];

    const results = generateBuildResults(config, compilerCtx, buildCtx);

    expect(results.globalStyleFiles).toEqual(['/dist/assets/z.css', '/dist/assets/a.css']);
  });

  it('skips global-style output targets with no resolved input', () => {
    config.outputTargets = [
      {
        type: 'global-style',
        fileName: 'unused.css',
        dir: '/dist/assets',
      } as d.OutputTargetGlobalStyle,
    ];

    const results = generateBuildResults(config, compilerCtx, buildCtx);

    expect(results.globalStyleFiles).toEqual([]);
  });
});
