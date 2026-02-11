import type * as d from '@stencil/core';
import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { validateConfig } from '../validate-config';

describe('validateStats', () => {
  let userConfig: d.Config;

  beforeEach(() => {
    userConfig = mockConfig();
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
