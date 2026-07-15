import { mockValidatedConfig } from '@stencil/core/testing';
import { describe, expect, it } from 'vitest';

import { getTsOptionsToExtend } from '../ts-config';

describe('ts-config.ts', () => {
  describe('getTsOptionsToExtend', () => {
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
