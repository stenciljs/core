import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const stdEnv = vi.hoisted(() => ({ isCI: false }));

vi.mock('std-env', () => ({
  get isCI() {
    return stdEnv.isCI;
  },
}));
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(JSON.stringify({ devDependencies: {} })),
}));
vi.mock('nypm', () => ({ addDevDependency: vi.fn().mockResolvedValue(undefined) }));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

vi.mock('../wizard/splash', () => ({ printSplash: vi.fn() }));
vi.mock('../wizard/discover', () => ({ discoverPlugins: vi.fn().mockResolvedValue([]) }));
vi.mock('../wizard/init/apply', () => ({}));
vi.mock('../wizard/init/steps', () => ({
  KNOWN_INTEGRATIONS: [
    {
      package: '@stencil/sass',
      displayName: 'Sass',
      description: 'Sass/SCSS styles',
      group: 'Styling',
    },
  ],
  promptAddCapabilities: vi.fn().mockResolvedValue({ toInstall: [], toConfigure: [] }),
  promptCustomPackages: vi.fn().mockResolvedValue([]),
  withVersionRanges: (packages: string[]) => packages,
}));

import { readFile } from 'node:fs/promises';
import * as clack from '@clack/prompts';
import { addDevDependency } from 'nypm';
import type { ValidatedConfig } from '@stencil/core/compiler';

import { taskAdd } from '../task-add';
import { discoverPlugins } from '../wizard/discover';
import * as steps from '../wizard/init/steps';
import type { DiscoveredPlugin } from '../wizard/discover';

const CWD = '/project';
const mockStrictConfig = {
  rootDir: CWD,
  srcDir: `${CWD}/src`,
  namespace: 'MyProject',
  fsNamespace: 'myproject',
  outputTargets: [],
} as unknown as ValidatedConfig;

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
    vi.mocked(discoverPlugins).mockResolvedValue([]);
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ devDependencies: {} }));
    vi.mocked(steps.promptAddCapabilities).mockResolvedValue({ toInstall: [], toConfigure: [] });
    vi.mocked(steps.promptCustomPackages).mockResolvedValue([]);
    vi.spyOn(process, 'cwd').mockReturnValue(CWD);
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code ?? 0}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('exits in CI mode without installing', async () => {
    stdEnv.isCI = true;
    await expect(taskAdd(['@stencil/sass'], mockStrictConfig)).rejects.toThrow('exit:1');
    expect(clack.log.warn).toHaveBeenCalled();
    expect(vi.mocked(addDevDependency)).not.toHaveBeenCalled();
  });

  it('installs the provided packages as dev dependencies', async () => {
    await taskAdd(['@stencil/sass', '@stencil/vitest'], mockStrictConfig);
    expect(vi.mocked(addDevDependency)).toHaveBeenCalledWith(['@stencil/sass', '@stencil/vitest'], {
      cwd: CWD,
      silent: true,
    });
  });

  it('calls run() on discovered plugins matching the installed packages', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    vi.mocked(discoverPlugins).mockResolvedValue([makeDiscovered('@stencil/sass', run)]);

    await taskAdd(['@stencil/sass'], mockStrictConfig);

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        isNewProject: false,
        config: expect.objectContaining({ rootDir: CWD }),
      }),
    );
  });

  it('does not call run() on discovered plugins not in the installed set', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    vi.mocked(discoverPlugins).mockResolvedValue([makeDiscovered('@stencil/vitest', run)]);

    await taskAdd(['@stencil/sass'], mockStrictConfig);

    expect(run).not.toHaveBeenCalled();
  });

  it('does not call run() on plugins with no init contribution', async () => {
    vi.mocked(discoverPlugins).mockResolvedValue([
      { packageName: '@stencil/sass', plugin: { generate: { styleExtensions: ['scss'] } } },
    ]);

    await taskAdd(['@stencil/sass'], mockStrictConfig); // should not throw
    expect(clack.outro).toHaveBeenCalled();
  });

  it('calls outro on success', async () => {
    await taskAdd(['@stencil/sass'], mockStrictConfig);
    expect(clack.outro).toHaveBeenCalled();
  });

  it('skips install in STENCIL_WIZARD_DEV mode', async () => {
    process.env.STENCIL_WIZARD_DEV = '../../dist/wizard.js';
    try {
      await taskAdd(['@stencil/sass'], mockStrictConfig);
      expect(vi.mocked(addDevDependency)).not.toHaveBeenCalled();
      expect(clack.log.warn).toHaveBeenCalled();
    } finally {
      delete process.env.STENCIL_WIZARD_DEV;
    }
  });

  describe('interactive mode (no packages provided)', () => {
    it('shows selection prompts instead of erroring', async () => {
      await taskAdd([], mockStrictConfig);
      expect(steps.promptAddCapabilities).toHaveBeenCalled();
      expect(steps.promptCustomPackages).toHaveBeenCalled();
    });

    it('installs packages selected from the known integrations list', async () => {
      vi.mocked(steps.promptAddCapabilities).mockResolvedValue({
        toInstall: [
          { package: '@stencil/sass', displayName: 'Sass', description: '', group: 'Styling' },
        ],
        toConfigure: [],
      });
      await taskAdd([], mockStrictConfig);
      expect(vi.mocked(addDevDependency)).toHaveBeenCalledWith(['@stencil/sass'], {
        cwd: CWD,
        silent: true,
      });
    });

    it('installs custom packages from free-text input', async () => {
      vi.mocked(steps.promptCustomPackages).mockResolvedValue(['my-plugin']);
      await taskAdd([], mockStrictConfig);
      expect(vi.mocked(addDevDependency)).toHaveBeenCalledWith(['my-plugin'], {
        cwd: CWD,
        silent: true,
      });
    });

    it('installs both known and custom packages together', async () => {
      vi.mocked(steps.promptAddCapabilities).mockResolvedValue({
        toInstall: [
          { package: '@stencil/sass', displayName: 'Sass', description: '', group: 'Styling' },
        ],
        toConfigure: [],
      });
      vi.mocked(steps.promptCustomPackages).mockResolvedValue(['my-plugin']);
      await taskAdd([], mockStrictConfig);
      expect(vi.mocked(addDevDependency)).toHaveBeenCalledWith(['@stencil/sass', 'my-plugin'], {
        cwd: CWD,
        silent: true,
      });
    });

    it('runs wizard for reconfigure selections without reinstalling', async () => {
      const run = vi.fn().mockResolvedValue(undefined);
      const discovered = makeDiscovered('@stencil/sass', run);
      vi.mocked(steps.promptAddCapabilities).mockResolvedValue({
        toInstall: [],
        toConfigure: [discovered],
      });
      await taskAdd([], mockStrictConfig);
      expect(vi.mocked(addDevDependency)).not.toHaveBeenCalled();
      expect(run).toHaveBeenCalledWith(
        expect.objectContaining({
          isNewProject: false,
          config: expect.objectContaining({ rootDir: CWD }),
        }),
      );
    });

    it('shows nothing-to-do message when no selections are made', async () => {
      await taskAdd([], mockStrictConfig);
      expect(vi.mocked(addDevDependency)).not.toHaveBeenCalled();
      expect(clack.outro).toHaveBeenCalledWith('Nothing to do.');
    });

    it('skips promptAddCapabilities when all known integrations are already installed', async () => {
      vi.mocked(readFile).mockResolvedValue(
        JSON.stringify({ devDependencies: { '@stencil/sass': '^3.0.0' } }),
      );
      await taskAdd([], mockStrictConfig);
      expect(steps.promptAddCapabilities).not.toHaveBeenCalled();
      expect(steps.promptCustomPackages).toHaveBeenCalled();
    });
  });
});
