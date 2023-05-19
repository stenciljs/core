import type * as d from '@stencil/core/declarations';
import { mockCompilerSystem, mockLogger, mockValidatedConfig } from '@stencil/core/testing';

import { createConfigFlags } from '../../../cli/config-flags';
import { validateServiceWorker } from '../validate-service-worker';

describe('validateServiceWorker', () => {
  let config: d.ValidatedConfig;
  let outputTarget: d.OutputTargetWww;

  beforeEach(() => {
    config = mockValidatedConfig({
      devMode: false,
      flags: createConfigFlags(),
      fsNamespace: 'app',
      hydratedFlag: null,
      logger: mockLogger(),
      outputTargets: [],
      packageJsonFilePath: '/package.json',
      rootDir: '/',
      sys: mockCompilerSystem(),
      testing: {},
      transformAliasedImportPaths: false,
    });
  });

  /**
   * A little util to work around a typescript annoyance. Because
   * `outputTarget.serviceWorker` is typed as
   * `serviceWorker?: ServiceWorkerConfig | null | false;` we get type errors
   * all over if we try to just access it directly. So instead, do a little
   * check to see if it's falsy. If not, we return it, and if it is we fail the test.
   *
   * @param serviceWorker The value of the `serviceWorker` property that would exist on
   * the `www` output target type
   * @returns a serviceWorker object or `void`, with a `void` return being
   * accompanied by a manually-triggered test failure.
   */
  function getServiceWorker(serviceWorker: d.ValidatedOutputTargetWww['serviceWorker']) {
    if (serviceWorker) {
      return serviceWorker;
    } else {
      throw new Error('the serviceWorker on the provided target was unexpectedly falsy, so this test needs to fail!');
    }
  }

  it('should add host.config.json to globIgnores', () => {
    outputTarget = {
      type: 'www',
      appDir: '/User/me/app/www/',
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(getServiceWorker(serviceWorker).globIgnores).toContain('**/host.config.json');
  });

  it('should set globIgnores from string', () => {
    outputTarget = {
      type: 'www',
      appDir: '/User/me/app/www/',
      serviceWorker: {
        globIgnores: '**/some-file.js',
      },
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(getServiceWorker(serviceWorker).globIgnores).toContain('**/some-file.js');
  });

  it('should set globDirectory', () => {
    outputTarget = {
      type: 'www',
      appDir: '/User/me/app/www/',
      serviceWorker: {
        globDirectory: '/custom/www',
      },
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(getServiceWorker(serviceWorker).globDirectory).toBe('/custom/www');
  });

  it('should set default globDirectory', () => {
    outputTarget = {
      type: 'www',
      appDir: '/User/me/app/www/',
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(getServiceWorker(serviceWorker).globDirectory).toBe('/User/me/app/www/');
  });

  it('should set globPatterns array', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: {
        globPatterns: ['**/*.{png,svg}'],
      },
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(getServiceWorker(serviceWorker).globPatterns).toEqual(['**/*.{png,svg}']);
  });

  it('should set globPatterns string', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: {
        globPatterns: '**/*.{png,svg}' as any,
      },
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(getServiceWorker(serviceWorker).globPatterns).toEqual(['**/*.{png,svg}']);
  });

  it('should create default globPatterns', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(getServiceWorker(serviceWorker).globPatterns).toEqual(['*.html', '**/*.{js,css,json}']);
  });

  it('should create default sw config when www type and prod mode', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(serviceWorker).not.toBe(null);
  });

  it('should not create default sw config when www type and devMode', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
    };
    config.devMode = true;

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(serviceWorker).toBe(null);
  });

  it('should create default sw config when true boolean, even if devMode', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: true as any,
    };
    config.devMode = true;

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(serviceWorker).not.toBe(true);
  });

  it('should not create sw config when in devMode', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: true as any,
    };
    config.devMode = true;

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(serviceWorker).toBe(null);
  });

  it('should create sw config when in devMode if flag serviceWorker', () => {
    outputTarget = {
      type: 'www',
      appDir: '/www',
      serviceWorker: true as any,
    };
    config.devMode = true;
    config.flags.serviceWorker = true;

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(serviceWorker).not.toBe(null);
  });

  it('should stay null', () => {
    outputTarget = {
      type: 'www',
      serviceWorker: null,
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(serviceWorker).toBe(null);
  });

  it('should stay false', () => {
    outputTarget = {
      type: 'www',
      serviceWorker: false,
    };

    const serviceWorker = validateServiceWorker(config, outputTarget);

    expect(serviceWorker).toBe(false);
  });
});
