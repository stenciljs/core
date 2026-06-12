import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import type { DiscoveredPlugin } from '../wizard/discover';
import type { KnownIntegration } from '../wizard/init/steps';

// vi.hoisted runs before vi.mock hoisting - used for values that vary between tests
const stdEnv = vi.hoisted(() => ({ isCI: false }));

vi.mock('std-env', () => ({
  get isCI() {
    return stdEnv.isCI;
  },
}));
vi.mock('node:fs', () => ({ existsSync: vi.fn().mockReturnValue(false) }));
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn().mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })),
}));
vi.mock('nypm', () => ({
  addDevDependency: vi.fn().mockResolvedValue(undefined),
  installDependencies: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  log: { warn: vi.fn(), info: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  cancel: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
}));

vi.mock('../wizard/splash', () => ({ printSplash: vi.fn(), CLI_VERSION: '0.0.0-test' }));
vi.mock('../wizard/discover', () => ({ discoverPlugins: vi.fn().mockResolvedValue([]) }));
vi.mock('../wizard/init/steps', () => ({
  KNOWN_INTEGRATIONS: [],
  promptProjectName: vi.fn().mockResolvedValue('my-lib'),
  promptOutputs: vi.fn().mockResolvedValue([]),
  promptFeatures: vi
    .fn()
    .mockResolvedValue({ signals: false, globalStyle: false, globalScript: false }),
  promptDocs: vi.fn().mockResolvedValue([]),
  promptIntegrations: vi.fn().mockResolvedValue([]),
  promptAddCapabilities: vi.fn().mockResolvedValue({ toInstall: [], toConfigure: [] }),
}));
vi.mock('../wizard/init/apply', () => ({
  applyPackageJsonFields: vi.fn().mockResolvedValue(undefined),
  copyTemplate: vi.fn().mockResolvedValue(undefined),
  writeStencilConfig: vi.fn().mockResolvedValue(undefined),
  writeGlobalStyle: vi.fn().mockResolvedValue(undefined),
  writeGlobalScript: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@stencil/templates', () => ({
  generatePackageJsonFields: vi.fn().mockReturnValue({
    type: 'module',
    module: './dist/loader-bundle/index.js',
    types: './dist/types/loader.d.ts',
  }),
  generateStencilConfig: vi.fn().mockReturnValue(null),
  toPascalCase: (str: string) =>
    str
      .split('-')
      .map((p: string) => p[0].toUpperCase() + p.slice(1))
      .join(''),
}));

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as clack from '@clack/prompts';
import { generatePackageJsonFields, generateStencilConfig } from '@stencil/templates';
import { addDevDependency, installDependencies } from 'nypm';
import type { ValidatedConfig } from '@stencil/core/compiler';

import { taskInit } from '../task-init';
import { discoverPlugins } from '../wizard/discover';
import { applyPackageJsonFields, copyTemplate, writeStencilConfig } from '../wizard/init/apply';
import {
  KNOWN_INTEGRATIONS,
  promptAddCapabilities,
  promptDocs,
  promptFeatures,
  promptIntegrations,
  promptOutputs,
  promptProjectName,
} from '../wizard/init/steps';
import type { CoreCompiler } from '../load-compiler';

const CWD = '/project';

const mockStrictConfig = {
  rootDir: CWD,
  srcDir: `${CWD}/src`,
  namespace: 'MyProject',
  fsNamespace: 'myproject',
  outputTargets: [],
} as unknown as ValidatedConfig;
const mockCoreCompiler = {
  validateConfig: vi.fn().mockReturnValue({
    config: {
      rootDir: CWD,
      srcDir: `${CWD}/src`,
      namespace: 'MyProject',
      fsNamespace: 'myproject',
      outputTargets: [],
    },
  }),
} as unknown as CoreCompiler;

function makeIntegration(pkg: string, group = 'Testing'): KnownIntegration {
  return { package: pkg, displayName: pkg, description: '', group };
}

function makeDiscovered(
  packageName: string,
  run: (ctx: unknown) => Promise<void> = vi.fn().mockResolvedValue(undefined),
): DiscoveredPlugin {
  return {
    packageName,
    plugin: {
      init: {
        id: packageName,
        displayName: packageName,
        description: '',
        run: run as (ctx: never) => Promise<void>,
      },
    },
  };
}

function mockPackageJson(deps: string[] = [], devDeps: string[] = []) {
  const pkg = {
    dependencies: Object.fromEntries(deps.map((d) => [d, 'latest'])),
    devDependencies: Object.fromEntries(devDeps.map((d) => [d, 'latest'])),
  };
  vi.mocked(readFile).mockResolvedValue(JSON.stringify(pkg) as never);
}

describe('taskInit', () => {
  beforeEach(() => {
    stdEnv.isCI = false;
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(discoverPlugins).mockResolvedValue([]);
    vi.mocked(promptProjectName).mockResolvedValue('my-lib');
    vi.mocked(promptOutputs).mockResolvedValue([]);
    vi.mocked(promptFeatures).mockResolvedValue({
      signals: false,
      globalStyle: false,
      globalScript: false,
    });
    vi.mocked(promptDocs).mockResolvedValue([]);
    vi.mocked(promptIntegrations).mockResolvedValue([]);
    vi.mocked(promptAddCapabilities).mockResolvedValue({ toInstall: [], toConfigure: [] });
    vi.mocked(generateStencilConfig).mockReturnValue(null);
    vi.mocked(clack.confirm).mockResolvedValue(true);
    vi.mocked(clack.isCancel).mockReturnValue(false);
    vi.spyOn(process, 'cwd').mockReturnValue(CWD);
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code ?? 0}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  // ── new project ────────────────────────────────────────────────────────────

  it('exits in CI mode without prompting', async () => {
    stdEnv.isCI = true;
    await expect(taskInit(mockCoreCompiler, mockStrictConfig)).rejects.toThrow('exit:1');
    expect(clack.log.warn).toHaveBeenCalled();
    expect(vi.mocked(promptProjectName)).not.toHaveBeenCalled();
  });

  it('scaffolds the template with derived namespace on confirm', async () => {
    await taskInit(mockCoreCompiler, mockStrictConfig);
    expect(vi.mocked(copyTemplate)).toHaveBeenCalledWith(CWD, 'my-lib', 'MyLib');
    expect(vi.mocked(installDependencies)).toHaveBeenCalledWith({ cwd: CWD, silent: true });
    expect(clack.outro).toHaveBeenCalled();
  });

  it('strips npm scope and PascalCases the namespace', async () => {
    vi.mocked(promptProjectName).mockResolvedValue('@my-org/my-lib');
    await taskInit(mockCoreCompiler, mockStrictConfig);
    expect(vi.mocked(copyTemplate)).toHaveBeenCalledWith(CWD, '@my-org/my-lib', 'MyLib');
  });

  it('applies package.json fields derived from selected outputs', async () => {
    const fields = {
      type: 'module' as const,
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    };
    vi.mocked(generatePackageJsonFields).mockReturnValue(fields);
    vi.mocked(promptOutputs).mockResolvedValue([]);

    await taskInit(mockCoreCompiler, mockStrictConfig);

    expect(vi.mocked(generatePackageJsonFields)).toHaveBeenCalledWith([]);
    expect(vi.mocked(applyPackageJsonFields)).toHaveBeenCalledWith(CWD, fields);
  });

  it('passes standalone outputs to generatePackageJsonFields', async () => {
    vi.mocked(promptOutputs).mockResolvedValue(['standalone']);
    const fields = {
      type: 'module' as const,
      module: './dist/standalone/index.js',
      types: './dist/types/standalone.d.ts',
    };
    vi.mocked(generatePackageJsonFields).mockReturnValue(fields);

    await taskInit(mockCoreCompiler, mockStrictConfig);

    expect(vi.mocked(generatePackageJsonFields)).toHaveBeenCalledWith(['standalone']);
    expect(vi.mocked(applyPackageJsonFields)).toHaveBeenCalledWith(CWD, fields);
  });

  it('applies package.json fields before writing stencil config', async () => {
    const callOrder: string[] = [];
    vi.mocked(applyPackageJsonFields).mockImplementation(async () => {
      callOrder.push('applyPackageJsonFields');
    });
    vi.mocked(writeStencilConfig).mockImplementation(async () => {
      callOrder.push('writeStencilConfig');
    });
    vi.mocked(generateStencilConfig).mockReturnValue('config content');

    await taskInit(mockCoreCompiler, mockStrictConfig);

    expect(callOrder.indexOf('applyPackageJsonFields')).toBeLessThan(
      callOrder.indexOf('writeStencilConfig'),
    );
  });

  it('does not patch package.json when no integrations are selected', async () => {
    await taskInit(mockCoreCompiler, mockStrictConfig);
    expect(vi.mocked(addDevDependency)).not.toHaveBeenCalled();
  });

  it('installs selected integration packages as dev dependencies', async () => {
    vi.mocked(promptIntegrations).mockResolvedValue([
      makeIntegration('@stencil/vitest'),
      makeIntegration('@stencil/sass', 'Styling'),
    ]);
    await taskInit(mockCoreCompiler, mockStrictConfig);
    expect(vi.mocked(addDevDependency)).toHaveBeenCalledWith(['@stencil/vitest', '@stencil/sass'], {
      cwd: CWD,
      silent: true,
    });
  });

  it('does not discover plugins when no integrations are selected', async () => {
    await taskInit(mockCoreCompiler, mockStrictConfig);
    expect(vi.mocked(discoverPlugins)).not.toHaveBeenCalled();
  });

  it('calls run() on selected plugins after install', async () => {
    vi.mocked(promptIntegrations).mockResolvedValue([makeIntegration('@stencil/vitest')]);
    const run = vi.fn().mockResolvedValue(undefined);
    vi.mocked(discoverPlugins).mockResolvedValue([makeDiscovered('@stencil/vitest', run)]);

    await taskInit(mockCoreCompiler, mockStrictConfig);

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        isNewProject: true,
        config: expect.objectContaining({ rootDir: CWD }),
      }),
    );
  });

  it('does not call run() on plugins with no init contribution', async () => {
    vi.mocked(promptIntegrations).mockResolvedValue([makeIntegration('@stencil/sass', 'Styling')]);
    vi.mocked(discoverPlugins).mockResolvedValue([
      { packageName: '@stencil/sass', plugin: { generate: { styleExtensions: ['scss'] } } },
    ]);

    await taskInit(mockCoreCompiler, mockStrictConfig); // should not throw
  });

  it('cancels cleanly without scaffolding when the confirm prompt is dismissed', async () => {
    const cancelSym = Symbol('cancel') as unknown as boolean;
    vi.mocked(clack.confirm).mockResolvedValue(cancelSym);
    vi.mocked(clack.isCancel).mockReturnValue(true);

    await expect(taskInit(mockCoreCompiler, mockStrictConfig)).rejects.toThrow('exit:0');
    expect(clack.cancel).toHaveBeenCalled();
    expect(vi.mocked(copyTemplate)).not.toHaveBeenCalled();
  });

  // ── existing project ───────────────────────────────────────────────────────

  describe('existing project (add-capabilities mode)', () => {
    beforeEach(() => {
      vi.mocked(existsSync).mockReturnValue(true);
      mockPackageJson();
    });

    it('does not scaffold a template for an existing project', async () => {
      await taskInit(mockCoreCompiler, mockStrictConfig);
      expect(vi.mocked(copyTemplate)).not.toHaveBeenCalled();
      expect(vi.mocked(promptProjectName)).not.toHaveBeenCalled();
    });

    it('shows nothing-to-do message when all known integrations are installed and no wizard plugins discovered', async () => {
      // All KNOWN_INTEGRATIONS are installed (KNOWN_INTEGRATIONS is mocked as [])
      // and no plugins discovered - nothing to offer
      vi.mocked(discoverPlugins).mockResolvedValue([]);
      await taskInit(mockCoreCompiler, mockStrictConfig);
      expect(clack.log.info).toHaveBeenCalled();
      expect(clack.outro).toHaveBeenCalled();
      expect(vi.mocked(promptAddCapabilities)).not.toHaveBeenCalled();
    });

    it('prompts with installable integrations filtered by installed packages', async () => {
      const known = [
        makeIntegration('@stencil/vitest'),
        makeIntegration('@stencil/sass', 'Styling'),
      ];
      vi.mocked(KNOWN_INTEGRATIONS as KnownIntegration[]).length = 0;
      (KNOWN_INTEGRATIONS as KnownIntegration[]).push(...known);
      mockPackageJson([], ['@stencil/sass']); // sass already installed

      await taskInit(mockCoreCompiler, mockStrictConfig);

      expect(vi.mocked(promptAddCapabilities)).toHaveBeenCalledWith(
        [known[0]], // only vitest - sass is installed
        [], // no configurable discovered
      );
    });

    it('passes already-installed plugins with init contributions as configurable', async () => {
      const discovered = [makeDiscovered('@stencil/vitest')];
      vi.mocked(discoverPlugins).mockResolvedValue(discovered);
      mockPackageJson([], ['@stencil/vitest']);

      await taskInit(mockCoreCompiler, mockStrictConfig);

      expect(vi.mocked(promptAddCapabilities)).toHaveBeenCalledWith(
        expect.any(Array), // installable
        discovered, // configurable
      );
    });

    it('installs selected new integrations', async () => {
      const vitest = makeIntegration('@stencil/vitest');
      vi.mocked(promptAddCapabilities).mockResolvedValue({ toInstall: [vitest], toConfigure: [] });

      await taskInit(mockCoreCompiler, mockStrictConfig);

      expect(vi.mocked(addDevDependency)).toHaveBeenCalledWith(['@stencil/vitest'], {
        cwd: CWD,
        silent: true,
      });
    });

    it('calls run() for newly installed packages after re-discovery', async () => {
      const vitest = makeIntegration('@stencil/vitest');
      vi.mocked(promptAddCapabilities).mockResolvedValue({ toInstall: [vitest], toConfigure: [] });
      const run = vi.fn().mockResolvedValue(undefined);
      const discovered = [makeDiscovered('@stencil/vitest', run)];
      // first call: pre-install discovery (empty); second call: post-install re-discovery
      vi.mocked(discoverPlugins).mockResolvedValueOnce([]).mockResolvedValueOnce(discovered);

      await taskInit(mockCoreCompiler, mockStrictConfig);

      expect(run).toHaveBeenCalledWith(
        expect.objectContaining({
          isNewProject: false,
          config: expect.objectContaining({ rootDir: CWD }),
        }),
      );
    });

    it('calls run() for selected configurable plugins without reinstalling', async () => {
      const run = vi.fn().mockResolvedValue(undefined);
      const discovered = [makeDiscovered('@stencil/vitest', run)];
      vi.mocked(discoverPlugins).mockResolvedValue(discovered);
      vi.mocked(promptAddCapabilities).mockResolvedValue({
        toInstall: [],
        toConfigure: discovered,
      });

      await taskInit(mockCoreCompiler, mockStrictConfig);

      expect(vi.mocked(addDevDependency)).not.toHaveBeenCalled();
      expect(vi.mocked(installDependencies)).not.toHaveBeenCalled();
      expect(run).toHaveBeenCalledWith(
        expect.objectContaining({
          isNewProject: false,
          config: expect.objectContaining({ rootDir: CWD }),
        }),
      );
    });

    it('skips run() when nothing is selected', async () => {
      const run = vi.fn().mockResolvedValue(undefined);
      vi.mocked(discoverPlugins).mockResolvedValue([makeDiscovered('@stencil/vitest', run)]);
      vi.mocked(promptAddCapabilities).mockResolvedValue({ toInstall: [], toConfigure: [] });

      await taskInit(mockCoreCompiler, mockStrictConfig);

      expect(vi.mocked(addDevDependency)).not.toHaveBeenCalled();
      expect(vi.mocked(installDependencies)).not.toHaveBeenCalled();
      expect(run).not.toHaveBeenCalled();
      expect(clack.outro).toHaveBeenCalled();
    });

    it('cancels cleanly when the confirm prompt is dismissed', async () => {
      vi.mocked(discoverPlugins).mockResolvedValue([makeDiscovered('@stencil/vitest')]);
      vi.mocked(promptAddCapabilities).mockResolvedValue({
        toInstall: [makeIntegration('@stencil/sass', 'Styling')],
        toConfigure: [],
      });
      const cancelSym = Symbol('cancel') as unknown as boolean;
      vi.mocked(clack.confirm).mockResolvedValue(cancelSym);
      vi.mocked(clack.isCancel).mockReturnValue(true);

      await expect(taskInit(mockCoreCompiler, mockStrictConfig)).rejects.toThrow('exit:0');
      expect(clack.cancel).toHaveBeenCalled();
      expect(vi.mocked(addDevDependency)).not.toHaveBeenCalled();
    });
  });
});
