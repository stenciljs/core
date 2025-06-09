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
});
