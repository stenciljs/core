import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({ existsSync: vi.fn().mockReturnValue(false) }));
vi.mock('node:fs/promises', () => ({ readFile: vi.fn(), readdir: vi.fn() }));
vi.mock('node:os', () => ({ homedir: vi.fn().mockReturnValue('/home/user') }));

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { detectWorkspaceRoot } from '../wizard/project';

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
    vi.mocked(existsSync).mockImplementation((p) => String(p) === '/project/pnpm-workspace.yaml');
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
