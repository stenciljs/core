import type { EligiblePrimaryPackageOutputTarget } from '../../declarations';
import { DIST_TYPES, VALID_CONFIG_OUTPUT_TARGETS } from '../constants';
import { isEligiblePrimaryPackageOutputTarget } from '../output-target';
import { isValidConfigOutputTarget } from '../output-target';

describe('output-utils tests', () => {
  describe('isValidConfigOutputTarget', () => {
    it.each(VALID_CONFIG_OUTPUT_TARGETS)('should return true for valid output type "%s"', (outputTargetType) => {
      expect(isValidConfigOutputTarget(outputTargetType)).toBe(true);
    });

    it.each(['', 'my-target-that-i-made-up', DIST_TYPES])(
      'should return false for invalid config output type "%s"',
      (outputTargetType) => {
        expect(isValidConfigOutputTarget(outputTargetType)).toBe(false);
      },
    );
  });

  describe('isEligiblePrimaryPackageOutputTarget', () => {
    it.each<(typeof VALID_CONFIG_OUTPUT_TARGETS)[number]>([
      'copy',
      'custom',
      'dist-hydrate-script',
      'www',
      'stats',
      'docs-json',
      'docs-readme',
      'docs-vscode',
      'docs-custom',
    ])('should return false for $type', (outputTarget) => {
      const res = isEligiblePrimaryPackageOutputTarget({ type: outputTarget } as any);

      expect(res).toBe(false);
    });

    it.each<EligiblePrimaryPackageOutputTarget['type']>([
      'dist',
      'dist-collection',
      'dist-custom-elements',
      'dist-types',
    ])('should return true for `$type`', (outputTarget) => {
      const res = isEligiblePrimaryPackageOutputTarget({ type: outputTarget } as any);

      expect(res).toBe(true);
    });
  });
});
