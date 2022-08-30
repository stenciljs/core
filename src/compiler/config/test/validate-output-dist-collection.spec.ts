import type * as d from '@stencil/core/declarations';
import { validateConfig } from '../validate-config';
import { mockConfig, mockLoadConfigInit } from '@stencil/core/testing';

describe('validateDistCollectionOutputTarget', () => {
  let config: d.Config;

  beforeEach(() => {
    config = mockConfig();
  });

  it('sets correct default values', () => {
    const target: d.OutputTargetDistCollection = {
      type: 'dist-collection',
      empty: false,
      dir: null,
      collectionDir: null,
    };
    config.outputTargets = [target];

    const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

    expect(validatedConfig.outputTargets).toEqual([
      {
        type: 'dist-collection',
        empty: false,
        dir: '/dist/collection',
        collectionDir: null,
        transformAliasedImportPaths: false,
      },
    ]);
  });

  it('sets specified directory', () => {
    const target: d.OutputTargetDistCollection = {
      type: 'dist-collection',
      empty: false,
      dir: '/my-dist',
      collectionDir: null,
    };
    config.outputTargets = [target];

    const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

    expect(validatedConfig.outputTargets).toEqual([
      {
        type: 'dist-collection',
        empty: false,
        dir: '/my-dist',
        collectionDir: null,
        transformAliasedImportPaths: false,
      },
    ]);
  });

  describe('transformAliasedImportPaths', () => {
    it('sets option false when explicitly false in config', () => {
      const target: d.OutputTargetDistCollection = {
        type: 'dist-collection',
        empty: false,
        dir: null,
        collectionDir: null,
        transformAliasedImportPaths: false,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      expect(validatedConfig.outputTargets).toEqual([
        {
          type: 'dist-collection',
          empty: false,
          dir: '/dist/collection',
          collectionDir: null,
          transformAliasedImportPaths: false,
        },
      ]);
    });

    it('sets option true when explicity true in config', () => {
      const target: d.OutputTargetDistCollection = {
        type: 'dist-collection',
        empty: false,
        dir: null,
        collectionDir: null,
        transformAliasedImportPaths: true,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      expect(validatedConfig.outputTargets).toEqual([
        {
          type: 'dist-collection',
          empty: false,
          dir: '/dist/collection',
          collectionDir: null,
          transformAliasedImportPaths: true,
        },
      ]);
    });
  });
});
