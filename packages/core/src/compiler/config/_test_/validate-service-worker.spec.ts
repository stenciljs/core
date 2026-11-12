import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockCompilerSystem, mockLogger, mockValidatedConfig } from '../../../testing';
import { validateServiceWorker } from '../validate-service-worker';

describe('validateServiceWorker', () => {
  let config: d.ValidatedConfig;

  let outputTarget: d.OutputTargetWww;

  beforeEach(() => {
    config = mockValidatedConfig({
      devMode: false,
      fsNamespace: 'app',
      hydratedFlag: null,
      logger: mockLogger(),
      outputTargets: [],
      packageJsonFilePath: '/package.json',
      rootDir: '/',
      sys: mockCompilerSystem(),
      transformAliasedImportPaths: true,
    });
  });

  it('should add host.config.json to globIgnores', () => {
    outputTarget = {
      type: 'www',
      appDir: '/User/me/app/www/',
      serviceWorker: true,
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker!.globIgnores).toContain('**/host.config.json');
  });

  it('should set globIgnores from string', () => {
    outputTarget = {
      type: 'www',
      appDir: '/User/me/app/www/',
      serviceWorker: {
        globIgnores: '**/some-file.js',
      },
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker!.globIgnores).toContain('**/some-file.js');
  });

  it('should set globDirectory', () => {
    outputTarget = {
      type: 'www',
      appDir: '/User/me/app/www/',
      serviceWorker: {
        globDirectory: '/custom/www',
      },
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker!.globDirectory).toBe('/custom/www');
  });

  it('should set default globDirectory', () => {
    outputTarget = {
      type: 'www',
      appDir: '/User/me/app/www/',
      serviceWorker: true,
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker!.globDirectory).toBe('/User/me/app/www/');
  });

  it('should set globPatterns array', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: {
        globPatterns: ['**/*.{png,svg}'],
      },
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker!.globPatterns).toEqual(['**/*.{png,svg}']);
  });

  it('should set globPatterns string', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: {
        globPatterns: '**/*.{png,svg}' as any,
      },
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker!.globPatterns).toEqual(['**/*.{png,svg}']);
  });

  it('should create default globPatterns', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: true,
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker!.globPatterns).toEqual(['*.html', '**/*.{js,css,json}']);
  });

  it('should default to null when serviceWorker is not set', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker).toBe(null);
  });

  it('should create sw config when explicitly configured in prod mode', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: true,
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker).not.toBe(null);
  });

  it('should not create sw config when www type and devMode', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
    };
    config.devMode = true;
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker).toBe(null);
  });

  it('should not create sw config when explicitly configured but in devMode', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: true,
    };
    config.devMode = true;
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker).toBe(null);
  });

  it('should create sw config when in devMode if generateServiceWorker is true', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: true,
    };
    config.devMode = true;
    config.generateServiceWorker = true;
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker).not.toBe(null);
  });

  it('should stay null', () => {
    outputTarget = {
      type: 'www',
      serviceWorker: null,
    };
    validateServiceWorker(config, outputTarget);
    expect(outputTarget.serviceWorker).toBe(null);
  });
});
