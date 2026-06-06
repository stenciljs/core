import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import type { DiscoveredPlugin } from '../wizard/discover';
import type { KnownIntegration } from '../wizard/init/steps';

// vi.hoisted runs before vi.mock hoisting — used for values that vary between tests
const stdEnv = vi.hoisted(() => ({ isCI: false }));

vi.mock('std-env', () => ({
  get isCI() {
    return stdEnv.isCI;
  },
}));
vi.mock('node:fs', () => ({ existsSync: vi.fn().mockReturnValue(false) }));
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));
vi.mock('nypm', () => ({ installDependencies: vi.fn().mockResolvedValue(undefined) }));

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

vi.mock('../wizard/splash', () => ({ printSplash: vi.fn() }));
vi.mock('../wizard/discover', () => ({ discoverPlugins: vi.fn().mockResolvedValue([]) }));
vi.mock('../wizard/init/steps', () => ({
  KNOWN_INTEGRATIONS: [],
  promptProjectName: vi.fn().mockResolvedValue('my-lib'),
  promptIntegrations: vi.fn().mockResolvedValue([]),
  promptAddCapabilities: vi.fn().mockResolvedValue({ toInstall: [], toConfigure: [] }),
}));
vi.mock('../wizard/init/apply', () => ({
  copyTemplate: vi.fn().mockResolvedValue(undefined),
  patchPackageJson: vi.fn().mockResolvedValue(undefined),
  applyConfigPatches: vi.fn().mockResolvedValue(undefined),
}));

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as clack from '@clack/prompts';
import { installDependencies } from 'nypm';

import { taskInit } from '../task-init';
import { discoverPlugins } from '../wizard/discover';
import { copyTemplate, patchPackageJson, applyConfigPatches } from '../wizard/init/apply';
import {
  KNOWN_INTEGRATIONS,
  promptProjectName,
  promptIntegrations,
  promptAddCapabilities,
} from '../wizard/init/steps';

const CWD = '/project';

function makeIntegration(pkg: string, group = 'Testing'): KnownIntegration {
  return { package: pkg, displayName: pkg, description: '', group };
}

function makeDiscovered(
  packageName: string,
  configPatch?: { imports: string[] },
): DiscoveredPlugin {
  return {
    packageName,
    plugin: {
      init: {
        id: packageName,
        displayName: packageName,
        description: '',
        ...(configPatch ? { configPatch } : {}),
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
    vi.mocked(promptIntegrations).mockResolvedValue([]);
    vi.mocked(promptAddCapabilities).mockResolvedValue({ toInstall: [], toConfigure: [] });
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
    await expect(taskInit()).rejects.toThrow('exit:1');
    expect(clack.log.warn).toHaveBeenCalled();
    expect(vi.mocked(promptProjectName)).not.toHaveBeenCalled();
  });

  it('scaffolds the template with derived namespace on confirm', async () => {
    await taskInit();
    expect(vi.mocked(copyTemplate)).toHaveBeenCalledWith(CWD, 'my-lib', 'MyLib');
    expect(vi.mocked(installDependencies)).toHaveBeenCalledWith({ cwd: CWD, silent: true });
    expect(clack.outro).toHaveBeenCalled();
  });

  it('strips npm scope and PascalCases the namespace', async () => {
    vi.mocked(promptProjectName).mockResolvedValue('@my-org/my-lib');
    await taskInit();
    expect(vi.mocked(copyTemplate)).toHaveBeenCalledWith(CWD, '@my-org/my-lib', 'MyLib');
  });

  it('does not patch package.json when no integrations are selected', async () => {
    await taskInit();
    expect(vi.mocked(patchPackageJson)).not.toHaveBeenCalled();
  });

  it('patches package.json with selected integration packages before install', async () => {
    vi.mocked(promptIntegrations).mockResolvedValue([
      makeIntegration('@stencil/vitest'),
      makeIntegration('@stencil/sass', 'Styling'),
    ]);
    await taskInit();
    expect(vi.mocked(patchPackageJson)).toHaveBeenCalledWith(CWD, [
      '@stencil/vitest',
      '@stencil/sass',
    ]);
  });

  it('does not discover plugins when no integrations are selected', async () => {
    await taskInit();
    expect(vi.mocked(discoverPlugins)).not.toHaveBeenCalled();
  });

  it('applies config patches from plugins that declare them', async () => {
    vi.mocked(promptIntegrations).mockResolvedValue([makeIntegration('@stencil/vitest')]);
    const discovered = [
      makeDiscovered('@stencil/vitest', {
        imports: ["import { defineConfig } from 'vitest/config'"],
      }),
    ];
    vi.mocked(discoverPlugins).mockResolvedValue(discovered);

    await taskInit();

    expect(vi.mocked(applyConfigPatches)).toHaveBeenCalledWith(CWD, discovered);
  });

  it('skips applyConfigPatches when discovered plugins have no configPatch', async () => {
    vi.mocked(promptIntegrations).mockResolvedValue([makeIntegration('@stencil/sass', 'Styling')]);
    vi.mocked(discoverPlugins).mockResolvedValue([
      { packageName: '@stencil/sass', plugin: { generate: { styleExtensions: ['scss'] } } },
    ]);

    await taskInit();

    expect(vi.mocked(applyConfigPatches)).not.toHaveBeenCalled();
  });

  it('cancels cleanly without scaffolding when the confirm prompt is dismissed', async () => {
    const cancelSym = Symbol('cancel') as unknown as boolean;
    vi.mocked(clack.confirm).mockResolvedValue(cancelSym);
    vi.mocked(clack.isCancel).mockReturnValue(true);

    await expect(taskInit()).rejects.toThrow('exit:0');
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
      await taskInit();
      expect(vi.mocked(copyTemplate)).not.toHaveBeenCalled();
      expect(vi.mocked(promptProjectName)).not.toHaveBeenCalled();
    });

    it('shows nothing-to-do message when all known integrations are installed and no wizard plugins discovered', async () => {
      // All KNOWN_INTEGRATIONS are installed (KNOWN_INTEGRATIONS is mocked as [])
      // and no plugins discovered — nothing to offer
      vi.mocked(discoverPlugins).mockResolvedValue([]);
      await taskInit();
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

      await taskInit();

      expect(vi.mocked(promptAddCapabilities)).toHaveBeenCalledWith(
        [known[0]], // only vitest — sass is installed
        [], // no configurable discovered
      );
    });

    it('passes already-installed plugins with init contributions as configurable', async () => {
      const discovered = [makeDiscovered('@stencil/vitest')];
      vi.mocked(discoverPlugins).mockResolvedValue(discovered);
      mockPackageJson([], ['@stencil/vitest']);

      await taskInit();

      expect(vi.mocked(promptAddCapabilities)).toHaveBeenCalledWith(
        expect.any(Array), // installable
        discovered, // configurable
      );
    });

    it('installs selected new integrations', async () => {
      const vitest = makeIntegration('@stencil/vitest');
      vi.mocked(promptAddCapabilities).mockResolvedValue({ toInstall: [vitest], toConfigure: [] });

      await taskInit();

      expect(vi.mocked(patchPackageJson)).toHaveBeenCalledWith(CWD, ['@stencil/vitest']);
      expect(vi.mocked(installDependencies)).toHaveBeenCalledWith({ cwd: CWD, silent: true });
    });

    it('applies config patches for newly installed packages after re-discovery', async () => {
      const vitest = makeIntegration('@stencil/vitest');
      vi.mocked(promptAddCapabilities).mockResolvedValue({ toInstall: [vitest], toConfigure: [] });
      const discovered = [
        makeDiscovered('@stencil/vitest', {
          imports: ["import { defineConfig } from 'vitest/config'"],
        }),
      ];
      // first call: pre-install discovery (empty); second call: post-install re-discovery
      vi.mocked(discoverPlugins).mockResolvedValueOnce([]).mockResolvedValueOnce(discovered);

      await taskInit();

      expect(vi.mocked(applyConfigPatches)).toHaveBeenCalledWith(CWD, discovered);
    });

    it('applies config patches for selected configurable plugins without reinstalling', async () => {
      const discovered = [
        makeDiscovered('@stencil/vitest', {
          imports: ["import { defineConfig } from 'vitest/config'"],
        }),
      ];
      vi.mocked(discoverPlugins).mockResolvedValue(discovered);
      vi.mocked(promptAddCapabilities).mockResolvedValue({
        toInstall: [],
        toConfigure: discovered,
      });

      await taskInit();

      expect(vi.mocked(patchPackageJson)).not.toHaveBeenCalled();
      expect(vi.mocked(installDependencies)).not.toHaveBeenCalled();
      expect(vi.mocked(applyConfigPatches)).toHaveBeenCalledWith(CWD, discovered);
    });

    it('skips install and patches when nothing is selected', async () => {
      vi.mocked(discoverPlugins).mockResolvedValue([makeDiscovered('@stencil/vitest')]);
      // promptAddCapabilities returns empty selection
      vi.mocked(promptAddCapabilities).mockResolvedValue({ toInstall: [], toConfigure: [] });

      await taskInit();

      expect(vi.mocked(patchPackageJson)).not.toHaveBeenCalled();
      expect(vi.mocked(installDependencies)).not.toHaveBeenCalled();
      expect(vi.mocked(applyConfigPatches)).not.toHaveBeenCalled();
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

      await expect(taskInit()).rejects.toThrow('exit:0');
      expect(clack.cancel).toHaveBeenCalled();
      expect(vi.mocked(patchPackageJson)).not.toHaveBeenCalled();
    });
  });
});
