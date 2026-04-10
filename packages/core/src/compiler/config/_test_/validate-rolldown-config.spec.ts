import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { validateRolldownConfig } from '../validate-rolldown-config';

describe('validateStats', () => {
  let config: d.Config;

  beforeEach(() => {
    config = {};
  });

  it('should use default if no config provided', () => {
    const rolldownConfig = validateRolldownConfig(config);
    expect(rolldownConfig).toEqual({
      inputOptions: {},
      outputOptions: {},
    });
  });

  it('should set based on inputOptions if provided', () => {
    config.rolldownConfig = {
      inputOptions: {
        context: 'window',
      },
    };
    const rolldownConfig = validateRolldownConfig(config);
    expect(rolldownConfig).toEqual({
      inputOptions: {
        context: 'window',
      },
      outputOptions: {},
    });
  });

  it('should use default if inputOptions is not provided but outputOptions is', () => {
    config.rolldownConfig = {
      outputOptions: {
        globals: {
          jquery: '$',
        },
      },
    };

    const rolldownConfig = validateRolldownConfig(config);
    expect(rolldownConfig).toEqual({
      inputOptions: {},
      outputOptions: {
        globals: {
          jquery: '$',
        },
      },
    });
  });

  it('should pass all valid config data through and not those that are extraneous', () => {
    config.rolldownConfig = {
      inputOptions: {
        context: 'window',
        external: 'external_symbol',
        notAnOption: {},
      },
      outputOptions: {
        globals: {
          jquery: '$',
        },
      },
    } as d.RolldownConfig;

    const rolldownConfig = validateRolldownConfig(config);
    expect(rolldownConfig).toEqual({
      inputOptions: {
        context: 'window',
        external: 'external_symbol',
      },
      outputOptions: {
        globals: {
          jquery: '$',
        },
      },
    });
  });
});
