import { mockValidatedConfig } from '@stencil/core/testing';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { getTsOptionsToExtend } from '../ts-config';

describe('ts-config.ts', () => {
  describe('getTsOptionsToExtend', () => {
    it('defaults moduleResolution to Bundler when the user tsconfig does not set it', () => {
      const config = mockValidatedConfig();
      const tsOptions = getTsOptionsToExtend(config);
      expect(tsOptions.moduleResolution).toBe(ts.ModuleResolutionKind.Bundler);
    });

    it('respects an explicit moduleResolution: NodeJs in the user tsconfig', () => {
      const config = mockValidatedConfig({
        tsCompilerOptions: { moduleResolution: ts.ModuleResolutionKind.NodeJs },
      });
      const tsOptions = getTsOptionsToExtend(config);
      expect(tsOptions.moduleResolution).toBe(ts.ModuleResolutionKind.NodeJs);
    });

    it('respects an explicit moduleResolution: Bundler in the user tsconfig', () => {
      const config = mockValidatedConfig({
        tsCompilerOptions: { moduleResolution: ts.ModuleResolutionKind.Bundler },
      });
      const tsOptions = getTsOptionsToExtend(config);
      expect(tsOptions.moduleResolution).toBe(ts.ModuleResolutionKind.Bundler);
    });

    it('falls back to Bundler for unsupported resolution kinds like NodeNext', () => {
      const config = mockValidatedConfig({
        tsCompilerOptions: { moduleResolution: ts.ModuleResolutionKind.NodeNext },
      });
      const tsOptions = getTsOptionsToExtend(config);
      expect(tsOptions.moduleResolution).toBe(ts.ModuleResolutionKind.Bundler);
    });
    it('defaults skipLibCheck to true when the user tsconfig does not set it', () => {
      const config = mockValidatedConfig();
      const tsOptions = getTsOptionsToExtend(config);
      expect(tsOptions.skipLibCheck).toBe(true);
    });

    it('respects an explicit skipLibCheck: false in the user tsconfig', () => {
      const config = mockValidatedConfig({ tsCompilerOptions: { skipLibCheck: false } });
      const tsOptions = getTsOptionsToExtend(config);
      expect(tsOptions.skipLibCheck).toBeUndefined();
    });

    it('respects an explicit skipLibCheck: true in the user tsconfig', () => {
      const config = mockValidatedConfig({ tsCompilerOptions: { skipLibCheck: true } });
      const tsOptions = getTsOptionsToExtend(config);
      expect(tsOptions.skipLibCheck).toBeUndefined();
    });
  });
});
