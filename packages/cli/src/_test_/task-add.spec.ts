import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const stdEnv = vi.hoisted(() => ({ isCI: false }));

vi.mock('std-env', () => ({
  get isCI() {
    return stdEnv.isCI;
  },
}));
vi.mock('node:fs', () => ({ existsSync: vi.fn().mockReturnValue(true) }));
vi.mock('nypm', () => ({ installDependencies: vi.fn().mockResolvedValue(undefined) }));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: { warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

vi.mock('../wizard/splash', () => ({ printSplash: vi.fn() }));
vi.mock('../wizard/discover', () => ({ discoverPlugins: vi.fn().mockResolvedValue([]) }));
vi.mock('../wizard/init/apply', () => ({
  patchPackageJson: vi.fn().mockResolvedValue(undefined),
}));

import { existsSync } from 'node:fs';
import * as clack from '@clack/prompts';
import { installDependencies } from 'nypm';

import { taskAdd } from '../task-add';
import { discoverPlugins } from '../wizard/discover';
import { patchPackageJson } from '../wizard/init/apply';
import type { DiscoveredPlugin } from '../wizard/discover';

const CWD = '/project';

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

describe('taskAdd', () => {
  beforeEach(() => {
    stdEnv.isCI = false;
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(discoverPlugins).mockResolvedValue([]);
    vi.spyOn(process, 'cwd').mockReturnValue(CWD);
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code ?? 0}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('exits in CI mode without patching or installing', async () => {
    stdEnv.isCI = true;
    await expect(taskAdd(['@stencil/sass'])).rejects.toThrow('exit:1');
    expect(clack.log.warn).toHaveBeenCalled();
    expect(vi.mocked(patchPackageJson)).not.toHaveBeenCalled();
  });

  it('exits with error when no stencil.config.ts is found', async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    await expect(taskAdd(['@stencil/sass'])).rejects.toThrow('exit:1');
    expect(clack.log.error).toHaveBeenCalled();
    expect(vi.mocked(patchPackageJson)).not.toHaveBeenCalled();
  });

  it('exits with error when no packages are provided', async () => {
    await expect(taskAdd([])).rejects.toThrow('exit:1');
    expect(clack.log.error).toHaveBeenCalled();
    expect(vi.mocked(patchPackageJson)).not.toHaveBeenCalled();
  });

  it('patches package.json and installs the provided packages', async () => {
    await taskAdd(['@stencil/sass', '@stencil/vitest']);
    expect(vi.mocked(patchPackageJson)).toHaveBeenCalledWith(CWD, [
      '@stencil/sass',
      '@stencil/vitest',
    ]);
    expect(vi.mocked(installDependencies)).toHaveBeenCalledWith({ cwd: CWD, silent: true });
  });

  it('calls run() on discovered plugins matching the installed packages', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    vi.mocked(discoverPlugins).mockResolvedValue([makeDiscovered('@stencil/sass', run)]);

    await taskAdd(['@stencil/sass']);

    expect(run).toHaveBeenCalledWith({ rootDir: CWD, isNewProject: false });
  });

  it('does not call run() on discovered plugins not in the installed set', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    vi.mocked(discoverPlugins).mockResolvedValue([makeDiscovered('@stencil/vitest', run)]);

    await taskAdd(['@stencil/sass']);

    expect(run).not.toHaveBeenCalled();
  });

  it('does not call run() on plugins with no init contribution', async () => {
    vi.mocked(discoverPlugins).mockResolvedValue([
      { packageName: '@stencil/sass', plugin: { generate: { styleExtensions: ['scss'] } } },
    ]);

    await taskAdd(['@stencil/sass']); // should not throw
    expect(clack.outro).toHaveBeenCalled();
  });

  it('calls outro on success', async () => {
    await taskAdd(['@stencil/sass']);
    expect(clack.outro).toHaveBeenCalled();
  });
});
