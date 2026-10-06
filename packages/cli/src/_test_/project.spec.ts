import { join } from 'node:path';
import { mockValidatedConfig } from '@stencil/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({ existsSync: vi.fn().mockReturnValue(false) }));
vi.mock('node:fs/promises', () => ({ readFile: vi.fn(), readdir: vi.fn() }));
vi.mock('node:os', () => ({ homedir: vi.fn().mockReturnValue('/home/user') }));
vi.mock('nypm', () => ({ detectPackageManager: vi.fn() }));

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { detectPackageManager as nypmDetect } from 'nypm';

import { detectPackageManager, detectWorkspaceRoot, toProjectConfig } from '../wizard/project';

function mockPkg(obj: Record<string, unknown> = {}) {
  vi.mocked(readFile).mockResolvedValue(JSON.stringify(obj) as never);
}

function noPackageJson() {
  vi.mocked(readFile).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
}

describe('detectWorkspaceRoot', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReturnValue(false);
    noPackageJson();
  });

  it('returns the dir when pnpm-workspace.yaml is present', async () => {
    vi.mocked(existsSync).mockImplementation((p) => String(p).endsWith('pnpm-workspace.yaml'));
    expect(await detectWorkspaceRoot('/project/packages/core')).toBe('/project/packages/core');
  });

  it('returns the dir when package.json has a workspaces field', async () => {
    mockPkg({ workspaces: ['packages/*'] });
    expect(await detectWorkspaceRoot('/project')).toBe('/project');
  });

  it('walks up and finds workspace root in a parent', async () => {
    vi.mocked(existsSync).mockImplementation(
      (p) => String(p) === join('/project', 'pnpm-workspace.yaml'),
    );
    expect(await detectWorkspaceRoot('/project/packages/core')).toBe('/project');
  });

  it('returns undefined when no workspace manifest is found before home dir', async () => {
    expect(await detectWorkspaceRoot('/home/user/my-project')).toBeUndefined();
  });

  it('returns undefined when walking reaches the filesystem root', async () => {
    expect(await detectWorkspaceRoot('/standalone-project')).toBeUndefined();
  });

  it('ignores package.json without workspaces field', async () => {
    mockPkg({ name: 'my-lib', dependencies: { '@stencil/core': '^5.0.0' } });
    expect(await detectWorkspaceRoot('/standalone-project')).toBeUndefined();
  });
});

describe('detectPackageManager', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(nypmDetect).mockResolvedValue(undefined);
  });

  it('prefers the lockfile / packageManager field over the invoking package manager', async () => {
    vi.mocked(nypmDetect).mockResolvedValue({ name: 'yarn', command: 'yarn' });
    vi.stubEnv('npm_config_user_agent', 'pnpm/10.12.1 npm/? node/v22.14.0 darwin arm64');
    expect(await detectPackageManager('/project')).toBe('yarn');
    expect(nypmDetect).toHaveBeenCalledWith('/project', {
      ignoreArgv: true,
      includeParentDirs: false,
    });
  });

  it('finds a lockfile in a parent directory', async () => {
    vi.mocked(nypmDetect).mockImplementation(async (dir) =>
      dir === '/home/user/workspace' ? { name: 'pnpm', command: 'pnpm' } : undefined,
    );
    vi.stubEnv('npm_config_user_agent', 'npm/10.9.2 node/v22.14.0 darwin arm64');
    expect(await detectPackageManager('/home/user/workspace/packages/core')).toBe('pnpm');
  });

  it('ignores a lockfile in the home directory', async () => {
    vi.mocked(nypmDetect).mockImplementation(async (dir) =>
      dir === '/home/user' ? { name: 'npm', command: 'npm' } : undefined,
    );
    vi.stubEnv('npm_config_user_agent', 'pnpm/10.12.1 npm/? node/v22.14.0 darwin arm64');
    expect(await detectPackageManager('/home/user/projects/my-lib')).toBe('pnpm');
    expect(nypmDetect).not.toHaveBeenCalledWith('/home/user', expect.anything());
  });

  it.each([
    ['pnpm/10.12.1 npm/? node/v22.14.0 darwin arm64', 'pnpm'],
    ['yarn/4.5.0 npm/? node/v22.14.0 darwin arm64', 'yarn'],
    ['bun/1.2.0 npm/? node/v22.14.0 darwin arm64', 'bun'],
    ['npm/10.9.2 node/v22.14.0 darwin arm64 workspaces/false', 'npm'],
  ])('falls back to the invoking package manager (%s)', async (userAgent, expected) => {
    vi.stubEnv('npm_config_user_agent', userAgent);
    expect(await detectPackageManager('/project')).toBe(expected);
  });

  it('defaults to npm when the user agent is missing or unrecognised', async () => {
    vi.stubEnv('npm_config_user_agent', '');
    expect(await detectPackageManager('/project')).toBe('npm');
    vi.stubEnv('npm_config_user_agent', 'deno/2.0.0');
    expect(await detectPackageManager('/project')).toBe('npm');
  });
});

describe('toProjectConfig', () => {
  it.each([true, false])('exposes generateExportMaps: %s', (generateExportMaps) => {
    const config = toProjectConfig(mockValidatedConfig({ generateExportMaps }));
    expect(config.generateExportMaps).toBe(generateExportMaps);
  });
});
