import type * as d from '../../declarations';
import type { EligiblePrimaryPackageOutputTarget } from '../../declarations';
import { DIST_TYPES, VALID_CONFIG_OUTPUT_TARGETS } from '../constants';
import {
  filterExcludedComponents,
  isEligiblePrimaryPackageOutputTarget,
  isValidConfigOutputTarget,
  shouldExcludeComponent,
} from '../output-target';

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

  describe('shouldExcludeComponent', () => {
    it('should return false when no patterns provided', () => {
      expect(shouldExcludeComponent('my-component', undefined)).toBe(false);
      expect(shouldExcludeComponent('my-component', [])).toBe(false);
    });

    it('should match exact component names', () => {
      expect(shouldExcludeComponent('demo-component', ['demo-component'])).toBe(true);
      expect(shouldExcludeComponent('my-component', ['demo-component'])).toBe(false);
    });

    it('should match glob patterns with wildcards', () => {
      expect(shouldExcludeComponent('demo-button', ['demo-*'])).toBe(true);
      expect(shouldExcludeComponent('demo-card', ['demo-*'])).toBe(true);
      expect(shouldExcludeComponent('my-button', ['demo-*'])).toBe(false);
    });

    it('should match patterns ending with suffix', () => {
      expect(shouldExcludeComponent('button-test', ['*-test'])).toBe(true);
      expect(shouldExcludeComponent('card-test', ['*-test'])).toBe(true);
      expect(shouldExcludeComponent('button-prod', ['*-test'])).toBe(false);
    });

    it('should match multiple patterns', () => {
      const patterns = ['demo-*', '*-test', 'specific-component'];

      expect(shouldExcludeComponent('demo-button', patterns)).toBe(true);
      expect(shouldExcludeComponent('card-test', patterns)).toBe(true);
      expect(shouldExcludeComponent('specific-component', patterns)).toBe(true);
      expect(shouldExcludeComponent('my-component', patterns)).toBe(false);
    });

    it('should handle complex glob patterns', () => {
      expect(shouldExcludeComponent('demo-internal-button', ['demo-internal-*'])).toBe(true);
      expect(shouldExcludeComponent('demo-button', ['demo-internal-*'])).toBe(false);
    });
  });

  describe('filterExcludedComponents', () => {
    const createMockComponent = (tagName: string): d.ComponentCompilerMeta => {
      return {
        tagName,
        componentClassName: tagName,
        sourceFilePath: `/src/components/${tagName}/${tagName}.tsx`,
      } as d.ComponentCompilerMeta;
    };

    const createMockConfig = (excludePatterns?: string[]): d.ValidatedConfig => {
      return {
        excludeComponents: excludePatterns,
        logger: {
          debug: jest.fn(),
        },
      } as any as d.ValidatedConfig;
    };

    it('should return all components when no exclude patterns', () => {
      const components = [
        createMockComponent('my-button'),
        createMockComponent('my-card'),
        createMockComponent('demo-widget'),
      ];
      const config = createMockConfig(undefined);

      const result = filterExcludedComponents(components, config);

      expect(result).toHaveLength(3);
      expect(result).toEqual(components);
    });

    it('should filter out components matching exact names', () => {
      const components = [
        createMockComponent('my-button'),
        createMockComponent('demo-widget'),
        createMockComponent('my-card'),
      ];
      const config = {
        ...createMockConfig(['demo-widget']),
        flags: { prod: true },
        logger: { debug: jest.fn(), info: jest.fn() },
      } as any;

      const result = filterExcludedComponents(components, config);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.tagName)).toEqual(['my-button', 'my-card']);
    });

    it('should filter out components matching glob patterns', () => {
      const components = [
        createMockComponent('my-button'),
        createMockComponent('demo-widget'),
        createMockComponent('demo-card'),
        createMockComponent('my-card'),
      ];
      const config = {
        ...createMockConfig(['demo-*']),
        flags: { prod: true },
        logger: { debug: jest.fn(), info: jest.fn() },
      } as any;

      const result = filterExcludedComponents(components, config);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.tagName)).toEqual(['my-button', 'my-card']);
    });

    it('should filter out components matching multiple patterns', () => {
      const components = [
        createMockComponent('my-button'),
        createMockComponent('demo-widget'),
        createMockComponent('button-test'),
        createMockComponent('my-card'),
        createMockComponent('specific-exclude'),
      ];
      const config = {
        ...createMockConfig(['demo-*', '*-test', 'specific-exclude']),
        flags: { prod: true },
        logger: { debug: jest.fn(), info: jest.fn() },
      } as any;

      const result = filterExcludedComponents(components, config);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.tagName)).toEqual(['my-button', 'my-card']);
    });

    it('should log debug messages for excluded components', () => {
      const components = [createMockComponent('my-button'), createMockComponent('demo-widget')];
      const config = {
        ...createMockConfig(['demo-*']),
        flags: { prod: true },
        logger: { debug: jest.fn(), info: jest.fn() },
      } as any;

      filterExcludedComponents(components, config);

      expect(config.logger.debug).toHaveBeenCalledWith('Excluding component from build: demo-widget');
    });

    it('should return empty array when all components are excluded', () => {
      const components = [createMockComponent('demo-widget'), createMockComponent('demo-card')];
      const config = {
        ...createMockConfig(['demo-*']),
        flags: { prod: true },
        logger: { debug: jest.fn(), info: jest.fn() },
      } as any;

      const result = filterExcludedComponents(components, config);

      expect(result).toHaveLength(0);
    });

    it('should log info message for production builds with excluded components', () => {
      const components = [
        createMockComponent('my-button'),
        createMockComponent('demo-widget'),
        createMockComponent('demo-card'),
      ];
      const config = {
        ...createMockConfig(['demo-*']),
        flags: { prod: true },
        logger: {
          debug: jest.fn(),
          info: jest.fn(),
        },
      } as any as d.ValidatedConfig;

      filterExcludedComponents(components, config);

      expect(config.logger.info).toHaveBeenCalledWith(
        'Excluding 2 components from production build: demo-widget, demo-card',
      );
    });

    it('should log singular form for single excluded component in production', () => {
      const components = [createMockComponent('my-button'), createMockComponent('demo-widget')];
      const config = {
        ...createMockConfig(['demo-widget']),
        flags: { prod: true },
        logger: {
          debug: jest.fn(),
          info: jest.fn(),
        },
      } as any as d.ValidatedConfig;

      filterExcludedComponents(components, config);

      expect(config.logger.info).toHaveBeenCalledWith('Excluding 1 component from production build: demo-widget');
    });

    it('should not exclude components without --prod flag', () => {
      const components = [createMockComponent('my-button'), createMockComponent('demo-widget')];
      const config = {
        ...createMockConfig(['demo-widget']),
        flags: {},
        logger: {
          debug: jest.fn(),
          info: jest.fn(),
        },
      } as any as d.ValidatedConfig;

      const result = filterExcludedComponents(components, config);

      // All components should be included when --prod flag is not set
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.tagName)).toEqual(['my-button', 'demo-widget']);
      expect(config.logger.info).not.toHaveBeenCalled();
      expect(config.logger.debug).not.toHaveBeenCalled();
    });

    it('should not log info message when no components are excluded', () => {
      const components = [createMockComponent('my-button'), createMockComponent('my-card')];
      const config = {
        ...createMockConfig(['demo-*']),
        flags: { prod: true },
        logger: {
          debug: jest.fn(),
          info: jest.fn(),
        },
      } as any as d.ValidatedConfig;

      filterExcludedComponents(components, config);

      expect(config.logger.info).not.toHaveBeenCalled();
    });
  });
});
