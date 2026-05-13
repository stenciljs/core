import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { isOutputTargetCollection, join, resolve, STENCIL_REBUNDLE } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateCollectionOutputTarget', () => {
  let config: d.Config;

  const rootDir = resolve('/');
  const defaultDir = join(rootDir, 'dist', 'collection');

  beforeEach(() => {
    config = mockConfig();
  });

  it('sets correct default values', () => {
    const target: d.OutputTargetCollection = {
      type: STENCIL_REBUNDLE,
      empty: false,
      dir: null,
    };
    config.outputTargets = [target];

    const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

    const collection = validatedConfig.outputTargets.find(isOutputTargetCollection);
    expect(collection).toEqual({
      type: STENCIL_REBUNDLE,
      empty: false,
      dir: defaultDir,
      transformAliasedImportPaths: true,
      skipInDev: true,
    });
  });

  it('sets specified directory', () => {
    const target: d.OutputTargetCollection = {
      type: STENCIL_REBUNDLE,
      empty: false,
      dir: '/my-dist',
    };
    config.outputTargets = [target];

    const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

    const collection = validatedConfig.outputTargets.find(isOutputTargetCollection);
    expect(collection).toEqual({
      type: STENCIL_REBUNDLE,
      empty: false,
      skipInDev: true,
      dir: '/my-dist',
      transformAliasedImportPaths: true,
    });
  });

  describe('transformAliasedImportPaths', () => {
    it.each([false, true])(
      "sets option '%s' when explicitly '%s' in config",
      (transformAliasedImportPaths: boolean) => {
        const target: d.OutputTargetCollection = {
          type: STENCIL_REBUNDLE,
          empty: false,
          dir: null,
          transformAliasedImportPaths,
        };
        config.outputTargets = [target];

        const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

        const collection = validatedConfig.outputTargets.find(isOutputTargetCollection);
        expect(collection).toEqual({
          type: STENCIL_REBUNDLE,
          empty: false,
          dir: defaultDir,
          transformAliasedImportPaths,
          skipInDev: true,
        });
      },
    );
  });
});
