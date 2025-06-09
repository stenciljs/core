import type * as d from '@stencil/core/declarations';

import { validateRollupConfig } from '../validate-rollup-config';

describe('validateStats', () => {
  let config: d.Config;

  beforeEach(() => {
    config = {};
  });

  it('should use default if no config provided', () => {
    const rollupConfig = validateRollupConfig(config);
    expect(rollupConfig).toEqual({
      inputOptions: {},
      outputOptions: {},
    });
  });

  it('should set based on inputOptions if provided', () => {
    config.rollupConfig = {
      inputOptions: {
        context: 'window',
      },
    };
    const rollupConfig = validateRollupConfig(config);
    expect(rollupConfig).toEqual({
      inputOptions: {
        context: 'window',
      },
      outputOptions: {},
    });
  });

  it('should use default if inputOptions is not provided but outputOptions is', () => {
    config.rollupConfig = {
      outputOptions: {
        globals: {
          jquery: '$',
        },
      },
    };

    const rollupConfig = validateRollupConfig(config);
    expect(rollupConfig).toEqual({
      inputOptions: {},
      outputOptions: {
        globals: {
          jquery: '$',
        },
      },
    });
  });

  it('should pass all valid config data through and not those that are extraneous', () => {
    config.rollupConfig = {
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
    } as d.RollupConfig;

    const rollupConfig = validateRollupConfig(config);
    expect(rollupConfig).toEqual({
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
