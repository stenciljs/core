import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import type { KnownIntegration } from '../wizard/init/steps';

// vi.hoisted runs before vi.mock hoisting — used for values that vary between tests
const stdEnv = vi.hoisted(() => ({ isCI: false }));

vi.mock('std-env', () => ({ get isCI() { return stdEnv.isCI; } }));
vi.mock('node:fs', () => ({ existsSync: vi.fn().mockReturnValue(false) }));
vi.mock('nypm', () => ({ installDependencies: vi.fn().mockResolvedValue(undefined) }));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  log: { warn: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  cancel: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
}));

vi.mock('../wizard/splash', () => ({ printSplash: vi.fn() }));
vi.mock('../wizard/discover', () => ({ discoverPlugins: vi.fn().mockResolvedValue([]) }));
vi.mock('../wizard/init/steps', () => ({
  promptProjectName: vi.fn().mockResolvedValue('my-lib'),
  promptIntegrations: vi.fn().mockResolvedValue([]),
}));
vi.mock('../wizard/init/apply', () => ({
  copyTemplate: vi.fn().mockResolvedValue(undefined),
  patchPackageJson: vi.fn().mockResolvedValue(undefined),
  applyConfigPatches: vi.fn().mockResolvedValue(undefined),
}));

import { existsSync } from 'node:fs';
import { installDependencies } from 'nypm';
import * as clack from '@clack/prompts';
import { discoverPlugins } from '../wizard/discover';
import { promptProjectName, promptIntegrations } from '../wizard/init/steps';
import { copyTemplate, patchPackageJson, applyConfigPatches } from '../wizard/init/apply';
import { taskInit } from '../task-init';

const CWD = '/project';

function makeIntegration(pkg: string, group = 'Testing'): KnownIntegration {
  return { package: pkg, displayName: pkg, description: '', group };
}

describe('taskInit', () => {
  beforeEach(() => {
    stdEnv.isCI = false;
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(discoverPlugins).mockResolvedValue([]);
    vi.mocked(promptProjectName).mockResolvedValue('my-lib');
    vi.mocked(promptIntegrations).mockResolvedValue([]);
    vi.mocked(clack.confirm).mockResolvedValue(true);
    vi.spyOn(process, 'cwd').mockReturnValue(CWD);
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code ?? 0}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('exits in CI mode without prompting', async () => {
    stdEnv.isCI = true;
    await expect(taskInit()).rejects.toThrow('exit:1');
    expect(clack.log.warn).toHaveBeenCalled();
    expect(vi.mocked(promptProjectName)).not.toHaveBeenCalled();
  });

  it('exits when stencil.config.ts already exists', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    await expect(taskInit()).rejects.toThrow('exit:1');
    expect(clack.log.warn).toHaveBeenCalledWith(expect.stringContaining('Existing'));
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
    expect(vi.mocked(patchPackageJson)).toHaveBeenCalledWith(CWD, ['@stencil/vitest', '@stencil/sass']);
  });

  it('does not discover plugins when no integrations are selected', async () => {
    await taskInit();
    expect(vi.mocked(discoverPlugins)).not.toHaveBeenCalled();
  });

  it('applies config patches from plugins that declare them', async () => {
    vi.mocked(promptIntegrations).mockResolvedValue([makeIntegration('@stencil/vitest')]);
    const discovered = [
      {
        packageName: '@stencil/vitest',
        plugin: {
          init: {
            id: 'vitest',
            displayName: 'Vitest',
            description: '',
            configPatch: { imports: ["import { defineConfig } from 'vitest/config'"] },
          },
        },
      },
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
});
