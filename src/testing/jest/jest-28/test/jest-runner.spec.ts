import type * as d from '@stencil/core/declarations';

import { ConfigFlags, createConfigFlags } from '../../../../cli/config-flags';
import { getEmulateConfigs, includeTestFile } from '../jest-runner';

describe('jest-runner', () => {
  it('should include for /path/prefix.spec.ts with --spec', () => {
    const testPath = `/path/prefix.spec.ts`;
    const env: d.E2EProcessEnv = {
      __STENCIL_SPEC_TESTS__: 'true',
    };

    expect(includeTestFile(testPath, env)).toBe(true);
  });

  it('should include for /path/spec.ts with --spec', () => {
    const testPath = `/path/spec.ts`;
    const env: d.E2EProcessEnv = {
      __STENCIL_SPEC_TESTS__: 'true',
    };

    expect(includeTestFile(testPath, env)).toBe(true);
  });

  it('should include for /path/prefix.e2e.ts with --e2e', () => {
    const testPath = `/path/prefix.e2e.ts`;
    const env: d.E2EProcessEnv = {
      __STENCIL_E2E_TESTS__: 'true',
    };

    expect(includeTestFile(testPath, env)).toBe(true);
  });

  it('should include for /path/e2e.ts with --e2e', () => {
    const testPath = `/path/e2e.ts`;
    const env: d.E2EProcessEnv = {
      __STENCIL_E2E_TESTS__: 'true',
    };

    expect(includeTestFile(testPath, env)).toBe(true);
  });

  it('should not include for /path/spec.ts with no --spec', () => {
    const testPath = `/path/spec.ts`;
    const env: d.E2EProcessEnv = {};

    expect(includeTestFile(testPath, env)).toBe(false);
  });

  it('should not include for /path/e2e.ts with no --e2e', () => {
    const testPath = `/path/e2e.ts`;
    const env: d.E2EProcessEnv = {};

    expect(includeTestFile(testPath, env)).toBe(false);
  });

  it('should not include for /path/e2e.ts with --spec', () => {
    const testPath = `/path/e2e.ts`;
    const env: d.E2EProcessEnv = {
      __STENCIL_SPEC_TESTS__: 'true',
    };

    expect(includeTestFile(testPath, env)).toBe(false);
  });

  it('should not include for /path/spec.ts with --e2e', () => {
    const testPath = `/path/spec.ts`;
    const env: d.E2EProcessEnv = {
      __STENCIL_E2E_TESTS__: 'true',
    };

    expect(includeTestFile(testPath, env)).toBe(false);
  });

  it('should use android userAgent from getEmulateConfigs', () => {
    const testing: d.TestingConfig = {
      emulate: [{ device: 'anDroiD' }, { device: 'iphone' }],
    };
    const flags: ConfigFlags = createConfigFlags({
      emulate: 'Android',
    });
    const emulateConfigs = getEmulateConfigs(testing, flags);
    expect(emulateConfigs).toHaveLength(1);
    expect(emulateConfigs[0].device).toBe('anDroiD');
  });

  it('should use android user agent from getEmulateConfigs', () => {
    const testing: d.TestingConfig = {
      emulate: [{ userAgent: 'Mozilla/Android' }, { userAgent: 'SomeUserAgent/iPhone X' }],
    };
    const flags: ConfigFlags = createConfigFlags({
      emulate: 'android',
    });
    const emulateConfigs = getEmulateConfigs(testing, flags);
    expect(emulateConfigs).toHaveLength(1);
    expect(emulateConfigs[0].userAgent).toBe('Mozilla/Android');
  });

  it('should use all configs from getEmulateConfigs by default', () => {
    const testing: d.TestingConfig = {
      emulate: [{ device: 'android' }, { device: 'iphone' }],
    };
    const flags: ConfigFlags = createConfigFlags();
    const emulateConfigs = getEmulateConfigs(testing, flags);
    expect(emulateConfigs).toHaveLength(2);
  });
});
