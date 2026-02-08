import * as coreCompiler from '@stencil/core/compiler';
import { mockValidatedConfig } from '@stencil/core/testing';
import { DIST, DIST_CUSTOM_ELEMENTS, DIST_HYDRATE_SCRIPT, WWW } from '@utils';

import { createConfigFlags } from '../../../cli/config-flags';
import { createSystem } from '../../../compiler/sys/stencil-sys';
import type * as d from '../../../declarations';
import * as shouldTrack from '../shouldTrack';
import * as telemetry from '../telemetry';
import { anonymizeConfigForTelemetry } from '../telemetry';

describe('telemetryBuildFinishedAction', () => {
  let config: d.ValidatedConfig;
  let sys: d.CompilerSystem;

  beforeEach(() => {
    sys = createSystem();
    config = mockValidatedConfig({
      flags: createConfigFlags({ task: 'build' }),
      outputTargets: [],
      sys,
    });
  });

  it('issues a network request when complete', async () => {
    const spyShouldTrack = jest.spyOn(shouldTrack, 'shouldTrack');
    spyShouldTrack.mockReturnValue(
      new Promise((resolve) => {
        resolve(true);
      }),
    );

    const results = {
      componentGraph: {},
      duration: 100,
    } as d.CompilerBuildResults;

    await telemetry.telemetryBuildFinishedAction(sys, config, coreCompiler, results);
    expect(spyShouldTrack).toHaveBeenCalled();

    spyShouldTrack.mockRestore();
  });
});

describe('telemetryAction', () => {
  let config: d.ValidatedConfig;
  let sys: d.CompilerSystem;

  beforeEach(() => {
    sys = createSystem();
    config = mockValidatedConfig({
      flags: createConfigFlags({ task: 'build' }),
      outputTargets: [],
      sys,
    });
  });

  it('issues a network request when no async function is passed', async () => {
    const spyShouldTrack = jest.spyOn(shouldTrack, 'shouldTrack');
    spyShouldTrack.mockReturnValue(
      new Promise((resolve) => {
        resolve(true);
      }),
    );

    await telemetry.telemetryAction(sys, config, coreCompiler, () => {});
    expect(spyShouldTrack).toHaveBeenCalled();

    spyShouldTrack.mockRestore();
  });

  it('issues a network request when passed async function is complete', async () => {
    const spyShouldTrack = jest.spyOn(shouldTrack, 'shouldTrack');
    spyShouldTrack.mockReturnValue(
      new Promise((resolve) => {
        resolve(true);
      }),
    );

    await telemetry.telemetryAction(sys, config, coreCompiler, async () => {
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });
    });

    expect(spyShouldTrack).toHaveBeenCalled();

    spyShouldTrack.mockRestore();
  });
});

describe('checkTelemetry', () => {
  const sys = createSystem();

  it('will read and write from a file, returning the correct status', async () => {
    await telemetry.enableTelemetry(sys);
    expect(await telemetry.checkTelemetry(sys)).toBe(true);
    await telemetry.disableTelemetry(sys);
    expect(await telemetry.checkTelemetry(sys)).toBe(false);
    await telemetry.enableTelemetry(sys);
    expect(await telemetry.checkTelemetry(sys)).toBe(true);
  });
});

describe('hasAppTarget()', () => {
  let config: d.ValidatedConfig;
  let sys: d.CompilerSystem;

  beforeEach(() => {
    sys = createSystem();
    config = mockValidatedConfig({ sys });
  });

  it("returns 'false' when `outputTargets` is empty", () => {
    config.outputTargets = [];
    expect(telemetry.hasAppTarget(config)).toBe(false);
  });

  it("returns 'false' when `outputTargets` contains `www` with no `baseUrl` and no service worker", () => {
    config.outputTargets = [{ type: WWW }];
    expect(telemetry.hasAppTarget(config)).toBe(false);
  });

  it("returns 'false' when `outputTargets` contains `www` with '/' baseUrl value", () => {
    config.outputTargets = [{ type: WWW, baseUrl: '/' }];
    expect(telemetry.hasAppTarget(config)).toBe(false);
  });

  it("returns 'true' when `outputTargets` contains `www` with a service worker", () => {
    config.outputTargets = [{ type: WWW, serviceWorker: { swDest: './tmp' } }];
    expect(telemetry.hasAppTarget(config)).toBe(true);
  });

  it("returns 'true' when `outputTargets` contains `www` with baseUrl", () => {
    config.outputTargets = [{ type: WWW, baseUrl: 'https://example.com' }];
    expect(telemetry.hasAppTarget(config)).toBe(true);
  });

  it("returns 'true' when `outputTargets` contains `www` with serviceWorker and baseUrl", () => {
    config.outputTargets = [{ type: WWW, baseUrl: 'https://example.com', serviceWorker: { swDest: './tmp' } }];
    expect(telemetry.hasAppTarget(config)).toBe(true);
  });
});

describe('prepareData', () => {
  let config: d.ValidatedConfig;
  let sys: d.CompilerSystem;

  beforeEach(() => {
    config = mockValidatedConfig();
    sys = config.sys;
    // set static name + versions, otherwise tests will pull in the dev build's data (which changes per build)
    sys.name = 'in-memory';
    sys.version = '__VERSION:STENCIL__';
  });

  it('prepares an object to send to ionic', async () => {
    const data = await telemetry.prepareData(coreCompiler, config, sys, 1000);
    expect(data).toEqual({
      arguments: [],
      build: coreCompiler.buildId,
      component_count: undefined,
      // the configuration generation is tested elsewhere, just verify we're sending something under this flag
      config: expect.any(Object),
      cpu_model: '',
      duration_ms: 1000,
      has_app_pwa_config: false,
      os_name: '',
      os_version: '',
      packages: [],
      packages_no_versions: [],
      rollup: coreCompiler.versions.rollup,
      stencil: coreCompiler.versions.stencil,
      system: 'in-memory __VERSION:STENCIL__',
      system_major: 'in-memory __VERSION:STENCIL__',
      targets: [],
      task: null,
      typescript: coreCompiler.versions.typescript,
      yarn: false,
    });
  });

  describe('has_app_pwa_config property', () => {
    it('sets `has_app_pwa_config` to true when there is a service worker', async () => {
      const config = mockValidatedConfig({
        outputTargets: [{ type: 'www', baseUrl: 'https://example.com' }],
      });

      const data = await telemetry.prepareData(coreCompiler, config, sys, 1000);

      expect(data.has_app_pwa_config).toBe(true);
    });

    it("sets `has_app_pwa_config` to true for a non '/' baseUrl", async () => {
      const config = mockValidatedConfig({
        outputTargets: [{ type: 'www', serviceWorker: { swDest: './tmp' } }],
      });

      const data = await telemetry.prepareData(coreCompiler, config, sys, 1000);

      expect(data.has_app_pwa_config).toBe(true);
    });
  });

  it('sends a component count when one is provided', async () => {
    const COMPONENT_COUNT = 12;

    const config = mockValidatedConfig({
      outputTargets: [{ type: 'www' }],
    });

    const data = await telemetry.prepareData(coreCompiler, config, sys, 1000, COMPONENT_COUNT);

    expect(data.component_count).toEqual(COMPONENT_COUNT);
  });
});

describe('anonymizeConfigForTelemetry', () => {
  let config: d.ValidatedConfig;
  let sys: d.CompilerSystem;

  beforeEach(() => {
    sys = createSystem();
    config = mockValidatedConfig({ sys });
  });

  it.each<keyof d.ValidatedConfig>([
    'rootDir',
    'fsNamespace',
    'packageJsonFilePath',
    'namespace',
    'srcDir',
    'srcIndexHtml',
    'buildLogFilePath',
    'cacheDir',
    'configPath',
    'tsconfig',
  ])("should anonymize top-level string prop '%s'", (prop: keyof d.ValidatedConfig) => {
    const anonymizedConfig = anonymizeConfigForTelemetry({
      ...config,
      [prop]: "shouldn't see this!",
      outputTargets: [],
    });
    expect(anonymizedConfig[prop]).toBe('omitted');
    expect(anonymizedConfig.outputTargets).toEqual([]);
  });

  it.each<keyof d.ValidatedConfig>([
    'commonjs',
    'devServer',
    'env',
    'logger',
    'rollupConfig',
    'sys',
    'testing',
    'tsCompilerOptions',
  ])("should remove objects under prop '%s'", (prop: keyof d.ValidatedConfig) => {
    const anonymizedConfig = anonymizeConfigForTelemetry({ ...config, [prop]: {}, outputTargets: [] });
    expect(anonymizedConfig.hasOwnProperty(prop)).toBe(false);
    expect(anonymizedConfig.outputTargets).toEqual([]);
  });

  it('should retain outputTarget props on the keep list', () => {
    const anonymizedConfig = anonymizeConfigForTelemetry({
      ...config,
      outputTargets: [
        { type: WWW, baseUrl: 'https://example.com' },
        { type: DIST_HYDRATE_SCRIPT, external: ['beep', 'boop'], dir: 'shoud/go/away' },
        { type: DIST_CUSTOM_ELEMENTS },
        { type: DIST_CUSTOM_ELEMENTS, generateTypeDeclarations: true },
        { type: DIST, typesDir: 'my-types' },
      ],
    });

    expect(anonymizedConfig.outputTargets).toEqual([
      { type: WWW, baseUrl: 'omitted' },
      { type: DIST_HYDRATE_SCRIPT, external: ['beep', 'boop'], dir: 'omitted' },
      { type: DIST_CUSTOM_ELEMENTS },
      { type: DIST_CUSTOM_ELEMENTS, generateTypeDeclarations: true },
      { type: DIST, typesDir: 'omitted' },
    ]);
  });
});
