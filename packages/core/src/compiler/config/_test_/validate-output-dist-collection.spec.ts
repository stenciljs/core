import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { join, resolve, STENCIL_META } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateStencilMetaOutputTarget', () => {
  let config: d.Config;

  const rootDir = resolve('/');
  const defaultDir = join(rootDir, 'dist', 'stencil-meta');

  beforeEach(() => {
    config = mockConfig();
  });

  it('sets correct default values', () => {
    const target: d.OutputTargetStencilMeta = {
      type: STENCIL_META,
      empty: false,
      dir: null,
    };
    config.outputTargets = [target];

    const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

    expect(validatedConfig.outputTargets).toEqual([
      {
        type: STENCIL_META,
        empty: false,
        dir: defaultDir,
        transformAliasedImportPaths: true,
      },
    ]);
  });

  it('sets specified directory', () => {
    const target: d.OutputTargetStencilMeta = {
      type: STENCIL_META,
      empty: false,
      dir: '/my-dist',
    };
    config.outputTargets = [target];

    const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

    expect(validatedConfig.outputTargets).toEqual([
      {
        type: STENCIL_META,
        empty: false,
        dir: '/my-dist',
        transformAliasedImportPaths: true,
      },
    ]);
  });

  describe('transformAliasedImportPaths', () => {
    it.each([false, true])(
      "sets option '%s' when explicitly '%s' in config",
      (transformAliasedImportPaths: boolean) => {
        const target: d.OutputTargetStencilMeta = {
          type: STENCIL_META,
          empty: false,
          dir: null,
          transformAliasedImportPaths,
        };
        config.outputTargets = [target];

        const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

        expect(validatedConfig.outputTargets).toEqual([
          {
            type: STENCIL_META,
            empty: false,
            dir: defaultDir,
            transformAliasedImportPaths,
          },
        ]);
      },
    );
  });
});
