import { mockCompilerSystem, mockLoadConfigInit } from '@stencil/core/testing';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { loadConfig } from '../load-config';

describe('stencil config - sourceMap option', () => {
  const configPath = require.resolve('./fixtures/stencil.config.ts');
  let sys: d.CompilerSystem;

  /**
   * Test helper for generating default `d.LoadConfigInit` objects.
   *
   * This function assumes the fields in the enclosing scope have been initialized.
   * @param overrides the properties on the default `d.LoadConfigInit` entity to manually override
   * @returns the default configuration initialization object, with any overrides applied
   */
  const getLoadConfigForTests = (overrides?: Partial<d.LoadConfigInit>): d.LoadConfigInit => {
    const defaults: d.LoadConfigInit = {
      configPath,
      sys,
      config: {},
      initTsConfig: true,
    };

    return mockLoadConfigInit({ ...defaults, ...overrides });
  };

  /**
   * Test helper for mocking the {@link ts.getParsedCommandLineOfConfigFile} function. This function returns the appropriate
   * `options` object based on the `sourceMap` argument.
   *
   * @param sourceMap The `sourceMap` option from the Stencil config.
   */
  const mockTsConfigParser = (sourceMap: boolean) => {
    jest.spyOn(ts, 'getParsedCommandLineOfConfigFile').mockReturnValue({
      options: {
        target: ts.ScriptTarget.ES2017,
        module: ts.ModuleKind.ESNext,
        sourceMap,
        inlineSources: sourceMap,
      },
      fileNames: [],
      errors: [],
    });
  };

  beforeEach(() => {
    sys = mockCompilerSystem();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sets sourceMap options to true in tsconfig', async () => {
    const testConfig = getLoadConfigForTests({ config: { sourceMap: true } });
    mockTsConfigParser(testConfig.config!.sourceMap!);

    const loadConfigResults = await loadConfig(testConfig);

    const { sourceMap, inlineSources } = loadConfigResults.config.tsCompilerOptions;
    expect(sourceMap).toBe(true);
    expect(inlineSources).toBe(true);
  });

  it('sets sourceMap options to false in tsconfig', async () => {
    const testConfig = getLoadConfigForTests({ config: { sourceMap: false } });
    mockTsConfigParser(testConfig.config!.sourceMap!);

    const loadConfigResults = await loadConfig(testConfig);

    const { sourceMap, inlineSources } = loadConfigResults.config.tsCompilerOptions;
    expect(sourceMap).toBe(false);
    expect(inlineSources).toBe(false);
  });

  it('sets the sourceMap options to true in tsconfig by default', async () => {
    const testConfig = getLoadConfigForTests();
    mockTsConfigParser(testConfig.config!.sourceMap!);

    const loadConfigResults = await loadConfig(testConfig);

    const { sourceMap, inlineSources } = loadConfigResults.config.tsCompilerOptions;
    expect(sourceMap).toBe(true);
    expect(inlineSources).toBe(true);
  });
});
