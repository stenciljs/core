import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { result } from '@utils';

import { generateBuildResults } from '../build-results';
import { generateBuildStats } from '../build-stats';

describe('generateBuildStats', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  beforeEach(() => {
    config = mockValidatedConfig();
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
  });

  it('should return a structured json object', async () => {
    buildCtx.buildResults = generateBuildResults(config, compilerCtx, buildCtx);

    const compilerBuildStats = result.unwrap(generateBuildStats(config, buildCtx));

    if (compilerBuildStats.hasOwnProperty('timestamp')) {
      delete compilerBuildStats.timestamp;
    }

    if (compilerBuildStats.hasOwnProperty('compiler') && compilerBuildStats.compiler.hasOwnProperty('version')) {
      delete compilerBuildStats.compiler.version;
    }

    expect(compilerBuildStats).toStrictEqual({
      app: { bundles: 0, components: 0, entries: 0, fsNamespace: 'testing', namespace: 'Testing', outputs: [] },
      collections: [],
      compiler: { name: 'in-memory' },
      componentGraph: {},
      components: [],
      entries: [],
      formats: { commonjs: [], es5: [], esm: [], esmBrowser: [], system: [] },
      options: {
        buildEs5: false,
        hashFileNames: false,
        hashedFileNameLength: 8,
        minifyCss: false,
        minifyJs: false,
      },
      rollupResults: {
        modules: [],
      },
      sourceGraph: {},
    });
  });

  it('should return diagnostics if an error is hit', async () => {
    buildCtx.buildResults = generateBuildResults(config, compilerCtx, buildCtx);

    buildCtx.buildResults.hasError = true;
    const diagnostic: d.Diagnostic = {
      level: 'error',
      type: 'horrible',
      messageText: 'the worst error _possible_ has just occurred',
      lines: [],
    };
    buildCtx.buildResults.diagnostics = [diagnostic];
    const diagnostics = result.unwrapErr(generateBuildStats(config, buildCtx));

    expect(diagnostics).toStrictEqual({
      diagnostics: [diagnostic],
    });
  });
});
