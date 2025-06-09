import ts from 'typescript';

import { ValidatedConfig } from '../../../../declarations';
import { mockValidatedConfig } from '../../../../testing/mocks';
import { createTestingSystem, TestingSystem } from '../../../../testing/testing-sys';
import * as tsConfig from '../typescript-config';

describe('typescript-config', () => {
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
    let tsSpy: jest.SpyInstance;

    beforeEach(() => {
      mockSys = createTestingSystem();
      config = mockValidatedConfig();

      jest.spyOn(tsConfig, 'getTsConfigPath').mockResolvedValue({
        path: 'tsconfig.json',
        content: '',
      });
      tsSpy = jest.spyOn(ts, 'getParsedCommandLineOfConfigFile');
    });

    it('includes watchOptions when provided', async () => {
      tsSpy.mockReturnValueOnce({
        watchOptions: {
          excludeFiles: ['exclude.ts'],
          excludeDirectories: ['exclude-dir'],
        },
        options: null,
        fileNames: [],
        errors: [],
      });

      const result = await tsConfig.validateTsConfig(config, mockSys, {});
      expect(result.watchOptions).toEqual({
        excludeFiles: ['exclude.ts'],
        excludeDirectories: ['exclude-dir'],
      });
    });

    it('does not include watchOptions when not provided', async () => {
      tsSpy.mockReturnValueOnce({
        options: null,
        fileNames: [],
        errors: [],
      });

      const result = await tsConfig.validateTsConfig(config, mockSys, {});
      expect(result.watchOptions).toEqual({});
    });
  });
});
