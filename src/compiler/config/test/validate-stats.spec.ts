import type * as d from '@stencil/core/declarations';
import { mockConfig, mockLoadConfigInit } from '@stencil/core/testing';

import { validateConfig } from '../validate-config';

describe('validateStats', () => {
  let userConfig: d.Config;

  beforeEach(() => {
    userConfig = mockConfig();
  });

  it('adds stats from flags, w/ no outputTargets', () => {
    // the flags field is expected to have been set by the mock creation function for unvalidated configs, hence the
    // bang operator
    userConfig.flags!.stats = true;

    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const o = config.outputTargets.find((o) => o.type === 'stats') as d.OutputTargetStats;
    expect(o).toBeDefined();
    expect(o.file).toContain('stencil-stats.json');
  });

  it('uses stats config, custom path', () => {
    userConfig.outputTargets = [
      {
        type: 'stats',
        file: 'custom-path.json',
      } as d.OutputTargetStats,
    ];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const o = config.outputTargets.find((o) => o.type === 'stats') as d.OutputTargetStats;
    expect(o).toBeDefined();
    expect(o.file).toContain('custom-path.json');
  });

  it('uses stats config, defaults file', () => {
    userConfig.outputTargets = [
      {
        type: 'stats',
      },
    ];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const o = config.outputTargets.find((o) => o.type === 'stats') as d.OutputTargetStats;
    expect(o).toBeDefined();
    expect(o.file).toContain('stencil-stats.json');
  });

  it('default no stats', () => {
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets.some((o) => o.type === 'stats')).toBe(false);
  });

  it('adds stats from flags with custom path string', () => {
    // Test --stats dist/stats.json behavior
    userConfig.flags!.stats = 'dist/custom-stats.json';

    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const o = config.outputTargets.find((o) => o.type === 'stats') as d.OutputTargetStats;
    expect(o).toBeDefined();
    expect(o.file).toContain('dist/custom-stats.json');
  });

  it('adds stats from flags with custom path (absolute)', () => {
    // Test --stats /tmp/stats.json behavior
    userConfig.flags!.stats = '/tmp/absolute-stats.json';

    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const o = config.outputTargets.find((o) => o.type === 'stats') as d.OutputTargetStats;
    expect(o).toBeDefined();
    expect(o.file).toBe('/tmp/absolute-stats.json');
  });

  it('flags stats path takes precedence over default when no outputTarget', () => {
    // When --stats has a path, it should be used instead of the default
    userConfig.flags!.stats = 'custom-location/stats.json';

    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const o = config.outputTargets.find((o) => o.type === 'stats') as d.OutputTargetStats;
    expect(o).toBeDefined();
    expect(o.file).toContain('custom-location/stats.json');
    expect(o.file).not.toContain('stencil-stats.json');
  });

  it('does not override existing stats outputTarget when flag has path', () => {
    // When there's already a stats outputTarget in config, flag should not add another
    userConfig.outputTargets = [
      {
        type: 'stats',
        file: 'config-defined.json',
      } as d.OutputTargetStats,
    ];
    userConfig.flags!.stats = 'flag-defined.json';

    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const statsTargets = config.outputTargets.filter((o) => o.type === 'stats');
    expect(statsTargets.length).toBe(1);
    expect(statsTargets[0].file).toContain('config-defined.json');
  });
});
