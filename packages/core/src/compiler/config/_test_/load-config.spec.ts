import { resolve, dirname } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as d from '@stencil/core';

import { mockCompilerSystem } from '../../../testing';
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
        rootDir: '/foo/bar',
      },
    });

    expect(loadedConfig.diagnostics).toHaveLength(0);

    const actualConfig = loadedConfig.config;
    expect(actualConfig).toBeDefined();
    expect(actualConfig.compat).toBeDefined();
    expect(actualConfig.compat!.enableImportInjection).toBe(true);
    // respects custom root dir
    expect(actualConfig.rootDir).toBe('/foo/bar');
  });

  it('uses the provided config path when no initial config provided', async () => {
    const loadedConfig = await loadConfig({
      configPath,
      sys,
    });

    expect(loadedConfig.diagnostics).toHaveLength(0);

    const actualConfig = loadedConfig.config;
    expect(actualConfig).toBeDefined();
    // set the config path based on the one provided in the init object
    expect(actualConfig.configPath).toBe(normalizePath(configPath));
  });

  describe('empty initialization argument', () => {
    it('provides sensible default values with no config', async () => {
      const loadedConfig = await loadConfig({ sys });

      const actualConfig = loadedConfig.config;
      expect(actualConfig).toBeDefined();
      expect(actualConfig.sys).toBeDefined();
      expect(actualConfig.logger).toBeDefined();
      expect(actualConfig.configPath).toBe(null);
    });

    it('auto-generates a tsconfig.json when one is missing', async () => {
      const tsconfigPath = resolve(dirname(configPath), 'tsconfig.json');
      expect(sys.accessSync(tsconfigPath)).toBe(false);
      const loadedConfig = await loadConfig({ configPath, sys });
      expect(sys.accessSync(tsconfigPath)).toBe(true);
      expect(loadedConfig.diagnostics).toHaveLength(0);
    });
  });

  describe('no initialization argument', () => {
    it('auto-generates a tsconfig.json and succeeds when no tsconfig is present', async () => {
      const loadConfigResults = await loadConfig({ sys });
      expect(loadConfigResults.diagnostics).toHaveLength(0);
      expect(loadConfigResults.config).toBeDefined();
    });
  });
});
