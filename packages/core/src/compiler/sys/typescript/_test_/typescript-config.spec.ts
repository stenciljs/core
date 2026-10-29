import path from 'path';
import { ValidatedConfig } from '@stencil/core';
import ts from 'typescript';
import { describe, expect, it, beforeEach, afterEach, vi, Mock } from 'vitest';

import { mockValidatedConfig } from '../../../../testing/mocks';
import { createTestingSystem, TestingSystem } from '../../../../testing/testing-sys';
import * as tsConfig from '../typescript-config';

vi.mock('typescript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('typescript')>();
  return {
    ...actual,
    default: {
      ...actual,
      getParsedCommandLineOfConfigFile: vi.fn(),
    },
  };
});

const getParsedCommandLineOfConfigFileMock = ts.getParsedCommandLineOfConfigFile as Mock;

describe('typescript-config', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('hasSrcDirectoryInclude', () => {
    it('returns `false` for a non-array argument', () => {
      // the intent of this test is to evaluate when a user doesn't provide an array, hence the type assertion
      expect(tsConfig.hasSrcDirectoryInclude('src' as unknown as string[], 'src')).toBe(false);
    });

    it('returns `false` for an empty array', () => {
      expect(tsConfig.hasSrcDirectoryInclude([], 'src/')).toBe(false);
    });

    it('returns `false` when an entry does not exist in the array', () => {
      expect(tsConfig.hasSrcDirectoryInclude(['src'], 'source')).toBe(false);
    });

    it('returns `true` when an entry does exist in the array', () => {
      expect(tsConfig.hasSrcDirectoryInclude(['src', 'foo'], 'src')).toBe(true);
    });

    it('returns `true` for globs', () => {
      expect(tsConfig.hasSrcDirectoryInclude(['src/**/*.ts', 'foo/'], 'src/**/*.ts')).toBe(true);
    });

    it.each([
      [['src'], './src'],
      [['./src'], 'src'],
      [['../src'], '../src'],
      [['*'], './*'],
    ])('returns `true` for relative paths', (includedPaths, srcDir) => {
      expect(tsConfig.hasSrcDirectoryInclude(includedPaths, srcDir)).toBe(true);
    });
  });

  describe('validateTsConfig', () => {
    let mockSys: TestingSystem;
    let config: ValidatedConfig;

    beforeEach(async () => {
      mockSys = createTestingSystem();
      config = mockValidatedConfig();
      // validateTsConfig bails early if no tsconfig file exists, preventing getParsedCommandLineOfConfigFile
      // from being called. Write a minimal tsconfig so the mock gets invoked.
      await mockSys.writeFile(path.join(config.rootDir, 'tsconfig.json'), '{}');
    });

    it('includes watchOptions when provided', async () => {
      getParsedCommandLineOfConfigFileMock.mockReturnValueOnce({
        watchOptions: {
          excludeFiles: ['exclude.ts'],
          excludeDirectories: ['exclude-dir'],
        },
        options: null,
        fileNames: [],
        errors: [],
      });

      const result = await tsConfig.validateTsConfig(config, mockSys);
      expect(result.watchOptions).toEqual({
        excludeFiles: ['exclude.ts'],
        excludeDirectories: ['exclude-dir'],
      });
    });

    it('does not include watchOptions when not provided', async () => {
      getParsedCommandLineOfConfigFileMock.mockReturnValueOnce({
        options: null,
        fileNames: [],
        errors: [],
      });

      const result = await tsConfig.validateTsConfig(config, mockSys);
      expect(result.watchOptions).toEqual({});
    });

    it.each([
      [ts.ScriptTarget.ES2017, true],
      [ts.ScriptTarget.ES2021, true],
      [ts.ScriptTarget.ES2022, false],
      [ts.ScriptTarget.ESNext, false],
      [undefined, false],
    ])('target %s warns about the ES2022 floor: %s', async (target, warns) => {
      getParsedCommandLineOfConfigFileMock.mockReturnValueOnce({
        options: { target, module: ts.ModuleKind.ESNext },
        fileNames: [],
        errors: [],
      });

      const result = await tsConfig.validateTsConfig(config, mockSys);
      const messages = result.diagnostics.map((d) => d.messageText);
      expect(messages.some((m) => String(m).includes('“es2022” or higher'))).toBe(warns);
    });
  });
});
