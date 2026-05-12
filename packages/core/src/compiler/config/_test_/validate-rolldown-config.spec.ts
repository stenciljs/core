import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { validateRolldownConfig } from '../validate-rolldown-config';

describe('validateRolldownConfig', () => {
  let config: d.Config;

  beforeEach(() => {
    config = {};
  });

  it('should return empty object if no config provided', () => {
    const rolldownConfig = validateRolldownConfig(config);
    expect(rolldownConfig).toEqual({});
  });

  it('should pass through external option', () => {
    config.rolldownConfig = { external: 'external_symbol' };
    const rolldownConfig = validateRolldownConfig(config);
    expect(rolldownConfig).toEqual({ external: 'external_symbol' });
  });

  it('should pass through treeshake option', () => {
    config.rolldownConfig = { treeshake: false };
    const rolldownConfig = validateRolldownConfig(config);
    expect(rolldownConfig).toEqual({ treeshake: false });
  });

  it('should pass both valid options and strip unknown keys', () => {
    config.rolldownConfig = {
      external: ['foo', 'bar'],
      treeshake: false,
      // @ts-expect-error — intentionally testing unknown key rejection
      notAnOption: {},
    };
    const rolldownConfig = validateRolldownConfig(config);
    expect(rolldownConfig).toEqual({ external: ['foo', 'bar'], treeshake: false });
  });
});
