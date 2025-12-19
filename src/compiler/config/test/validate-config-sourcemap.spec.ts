import { mockCompilerSystem, mockLoadConfigInit } from '@stencil/core/testing';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { loadConfig } from '../load-config';
import { validateConfig } from '../validate-config';

describe('stencil config - sourceMap option', () => {
  const configPath = require.resolve('./fixtures/stencil.config.ts');
  let sys = mockCompilerSystem();

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
      sys: sys as any,
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

  it('sets sourceMap to true when explicitly set to true', async () => {
    const userConfig: d.UnvalidatedConfig = { sourceMap: true };
    const { config: validatedConfig } = validateConfig(userConfig, {});
    expect(validatedConfig.sourceMap).toBe(true);

    mockTsConfigParser(validatedConfig.sourceMap);
    const testConfig = getLoadConfigForTests({ config: userConfig });
    const loadConfigResults = await loadConfig(testConfig);

    const { sourceMap, inlineSources } = loadConfigResults.config.tsCompilerOptions;
    expect(sourceMap).toBe(true);
    expect(inlineSources).toBe(true);
  });

  it('sets sourceMap to false when explicitly set to false', async () => {
    const userConfig: d.UnvalidatedConfig = { sourceMap: false };
    const { config: validatedConfig } = validateConfig(userConfig, {});
    expect(validatedConfig.sourceMap).toBe(false);

    mockTsConfigParser(validatedConfig.sourceMap);
    const testConfig = getLoadConfigForTests({ config: userConfig });
    const loadConfigResults = await loadConfig(testConfig);

    const { sourceMap, inlineSources } = loadConfigResults.config.tsCompilerOptions;
    expect(sourceMap).toBe(false);
    expect(inlineSources).toBe(false);
  });

  it('defaults to "dev" behavior (false in prod mode)', async () => {
    const userConfig: d.UnvalidatedConfig = { devMode: false };
    const { config: validatedConfig } = validateConfig(userConfig, {});
    expect(validatedConfig.sourceMap).toBe(false);

    mockTsConfigParser(validatedConfig.sourceMap);
    const testConfig = getLoadConfigForTests({ config: userConfig });
    const loadConfigResults = await loadConfig(testConfig);

    const { sourceMap, inlineSources } = loadConfigResults.config.tsCompilerOptions;
    expect(sourceMap).toBe(false);
    expect(inlineSources).toBe(false);
  });

  it('defaults to "dev" behavior (true in dev mode)', async () => {
    const userConfig: d.UnvalidatedConfig = { devMode: true };
    const { config: validatedConfig } = validateConfig(userConfig, {});
    expect(validatedConfig.sourceMap).toBe(true);

    mockTsConfigParser(validatedConfig.sourceMap);
    const testConfig = getLoadConfigForTests({ config: userConfig });
    const loadConfigResults = await loadConfig(testConfig);

    const { sourceMap, inlineSources } = loadConfigResults.config.tsCompilerOptions;
    expect(sourceMap).toBe(true);
    expect(inlineSources).toBe(true);
  });

  it('resolves "dev" to true when devMode is true', async () => {
    const userConfig: d.UnvalidatedConfig = { sourceMap: 'dev', devMode: true };
    const { config: validatedConfig } = validateConfig(userConfig, {});
    expect(validatedConfig.sourceMap).toBe(true);

    mockTsConfigParser(validatedConfig.sourceMap);
    const testConfig = getLoadConfigForTests({ config: userConfig });
    const loadConfigResults = await loadConfig(testConfig);

    const { sourceMap, inlineSources } = loadConfigResults.config.tsCompilerOptions;
    expect(sourceMap).toBe(true);
    expect(inlineSources).toBe(true);
  });

  it('resolves "dev" to false when devMode is false', async () => {
    const userConfig: d.UnvalidatedConfig = { sourceMap: 'dev', devMode: false };
    const { config: validatedConfig } = validateConfig(userConfig, {});
    expect(validatedConfig.sourceMap).toBe(false);

    mockTsConfigParser(validatedConfig.sourceMap);
    const testConfig = getLoadConfigForTests({ config: userConfig });
    const loadConfigResults = await loadConfig(testConfig);

    const { sourceMap, inlineSources } = loadConfigResults.config.tsCompilerOptions;
    expect(sourceMap).toBe(false);
    expect(inlineSources).toBe(false);
  });
});
