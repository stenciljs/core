import { mockCompilerSystem } from '../../../testing';
import { resolve, dirname } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as d from '@stencil/core';
import { normalizePath } from '../../../utils';
import { loadConfig } from '../load-config';

vi.mock('typescript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('typescript')>();
  return {
    ...actual,
    default: {
      ...actual,
      getParsedCommandLineOfConfigFile: vi.fn().mockReturnValue({
        options: {
          target: actual.ScriptTarget.ES2017,
          module: actual.ModuleKind.ESNext,
        },
        fileNames: [],
        errors: [],
      }),
    },
  };
});

describe('load config', () => {
  const configPath = resolve(import.meta.dirname, 'fixtures/stencil.config.ts');
  const configPath2 = resolve(import.meta.dirname, 'fixtures/stencil.config2.ts');

  let sys: d.CompilerSystem;

  beforeEach(() => {
    sys = mockCompilerSystem();
  });

  it("merges a user's configuration with a stencil.config file on disk", async () => {
    const loadedConfig = await loadConfig({
      configPath: configPath2,
      sys,
      config: {
        hashedFileNameLength: 9,
        rootDir: '/foo/bar',
      },
      initTsConfig: true,
    });

    expect(loadedConfig.diagnostics).toHaveLength(0);

    const actualConfig = loadedConfig.config;
    // this field is defined on the `init` argument, and should override the value found in the config on disk
    expect(actualConfig).toBeDefined();
    expect(actualConfig.hashedFileNameLength).toEqual(9);
    // these fields are defined in the config file on disk, and should be present
    expect(actualConfig.devMode).toBe(true);
    expect(actualConfig.extras).toBeDefined();
    expect(actualConfig.extras!.enableImportInjection).toBe(true);
    // respects custom root dir
    expect(actualConfig.rootDir).toBe('/foo/bar');
  });

  it('uses the provided config path when no initial config provided', async () => {
    const loadedConfig = await loadConfig({
      configPath,
      sys,
      initTsConfig: true,
    });

    expect(loadedConfig.diagnostics).toHaveLength(0);

    const actualConfig = loadedConfig.config;
    expect(actualConfig).toBeDefined();
    // set the config path based on the one provided in the init object
    expect(actualConfig.configPath).toBe(normalizePath(configPath));
    // this field is defined in the config file on disk, and should be present
    expect(actualConfig.hashedFileNameLength).toBe(13);
  });

  describe('empty initialization argument', () => {
    it('provides sensible default values with no config', async () => {
      const loadedConfig = await loadConfig({ initTsConfig: true, sys });

      const actualConfig = loadedConfig.config;
      expect(actualConfig).toBeDefined();
      expect(actualConfig.sys).toBeDefined();
      expect(actualConfig.logger).toBeDefined();
      expect(actualConfig.configPath).toBe(null);
    });

    it('creates a tsconfig file when "initTsConfig" set', async () => {
      const tsconfigPath = resolve(dirname(configPath), 'tsconfig.json');
      expect(sys.accessSync(tsconfigPath)).toBe(false);
      const loadedConfig = await loadConfig({ initTsConfig: true, configPath, sys });
      expect(sys.accessSync(tsconfigPath)).toBe(true);
      expect(loadedConfig.diagnostics).toHaveLength(0);
    });

    it('errors that a tsconfig file could not be created when "initTsConfig" isn\'t present', async () => {
      const loadedConfig = await loadConfig({ configPath, sys });
      expect(loadedConfig.diagnostics).toHaveLength(1);
      expect<d.Diagnostic>(loadedConfig.diagnostics[0]).toEqual({
        absFilePath: undefined,
        header: 'Missing tsconfig.json',
        level: 'error',
        lines: [],
        messageText: `Unable to load TypeScript config file. Please create a "tsconfig.json" file within the "${normalizePath(
          dirname(configPath),
        )}" directory.`,
        relFilePath: undefined,
        type: 'build',
      });
    });
  });

  describe('no initialization argument', () => {
    it('errors that a tsconfig file cannot be found', async () => {
      const loadConfigResults = await loadConfig({ sys });
      expect(loadConfigResults.diagnostics).toHaveLength(1);
      expect<d.Diagnostic>(loadConfigResults.diagnostics[0]).toEqual({
        absFilePath: undefined,
        header: 'Missing tsconfig.json',
        level: 'error',
        lines: [],
        messageText: expect.stringMatching(
          `Unable to load TypeScript config file. Please create a "tsconfig.json" file within the`,
        ),
        relFilePath: undefined,
        type: 'build',
      });
    });
  });
});
