import { join } from 'node:path';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const fsPromises = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
}));
vi.mock('node:fs/promises', () => fsPromises);
vi.mock('@stencil/templates', () => ({
  getTemplatePath: vi.fn().mockReturnValue('/template'),
}));

const nypm = vi.hoisted(() => ({
  detectPackageManager: vi.fn().mockResolvedValue({ name: 'pnpm' }),
}));
vi.mock('nypm', () => nypm);

import {
  applyPackageJsonFields,
  copyTemplate,
  scaffoldWorkspaceRoot,
  writeIndexHtml,
} from '../wizard/init/apply';

const PKG_PATH = join('/project', 'package.json');

function mockPkg(pkg: Record<string, unknown>) {
  fsPromises.readFile.mockResolvedValue(JSON.stringify(pkg));
}

describe('applyPackageJsonFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsPromises.writeFile.mockResolvedValue(undefined);
  });

  it('does nothing when fields is empty', async () => {
    await applyPackageJsonFields('/project', {});
    expect(fsPromises.readFile).not.toHaveBeenCalled();
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
  });

  it('writes loader fields into an existing package.json', async () => {
    mockPkg({ name: 'my-lib', version: '0.0.1' });

    await applyPackageJsonFields('/project', {
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });

    expect(fsPromises.readFile).toHaveBeenCalledWith(PKG_PATH, 'utf8');
    const written = JSON.parse(vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string);
    expect(written).toMatchObject({
      name: 'my-lib',
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });
  });

  it('writes standalone fields into an existing package.json', async () => {
    mockPkg({ name: 'my-lib' });

    await applyPackageJsonFields('/project', {
      type: 'module',
      module: './dist/standalone/index.js',
      types: './dist/types/standalone.d.ts',
    });

    const written = JSON.parse(vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string);
    expect(written.module).toBe('./dist/standalone/index.js');
    expect(written.types).toBe('./dist/types/standalone.d.ts');
    expect(written).not.toHaveProperty('main');
  });

  it('overwrites existing module/types fields', async () => {
    mockPkg({
      name: 'my-lib',
      module: './dist/old/index.js',
      types: './dist/old/index.d.ts',
    });

    await applyPackageJsonFields('/project', {
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });

    const written = JSON.parse(vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string);
    expect(written.module).toBe('./dist/loader-bundle/index.js');
    expect(written.types).toBe('./dist/types/loader.d.ts');
  });

  it('preserves existing fields not in the patch', async () => {
    mockPkg({ name: 'my-lib', version: '0.0.1', scripts: { build: 'stencil build' } });

    await applyPackageJsonFields('/project', {
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });

    const written = JSON.parse(vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string);
    expect(written.name).toBe('my-lib');
    expect(written.version).toBe('0.0.1');
    expect(written.scripts).toEqual({ build: 'stencil build' });
  });

  it('writes JSON with trailing newline', async () => {
    mockPkg({ name: 'my-lib' });

    await applyPackageJsonFields('/project', {
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });

    const raw = vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string;
    expect(raw.endsWith('\n')).toBe(true);
  });
});

describe('scaffoldWorkspaceRoot', () => {
  const ENOENT = () => Object.assign(new Error('ENOENT'), { code: 'ENOENT' });

  beforeEach(() => {
    vi.clearAllMocks();
    fsPromises.writeFile.mockResolvedValue(undefined);
    fsPromises.mkdir.mockResolvedValue(undefined);
    nypm.detectPackageManager.mockResolvedValue({ name: 'pnpm' });
  });

  function writtenPkg() {
    const call = vi.mocked(fsPromises.writeFile).mock.calls.find((c) => c[0] === PKG_PATH);
    return JSON.parse(call![1] as string);
  }

  it('adds a build script alongside a pre-existing scripts object (e.g. from `pnpm init`)', async () => {
    fsPromises.readFile
      .mockResolvedValueOnce(JSON.stringify({ name: 'wiz', scripts: { test: 'echo no test' } }))
      .mockRejectedValueOnce(ENOENT());

    await scaffoldWorkspaceRoot('/project', 'wiz', 'core');

    expect(writtenPkg().scripts).toEqual({ build: 'pnpm -r build', test: 'echo no test' });
  });

  it('adds a build script when no package.json exists yet', async () => {
    fsPromises.readFile.mockRejectedValueOnce(ENOENT()).mockRejectedValueOnce(ENOENT());

    await scaffoldWorkspaceRoot('/project', 'wiz', 'core');

    expect(writtenPkg().scripts).toEqual({ build: 'pnpm -r build' });
  });

  it('does not clobber an existing build script', async () => {
    fsPromises.readFile
      .mockResolvedValueOnce(
        JSON.stringify({ name: 'wiz', scripts: { build: 'custom build command' } }),
      )
      .mockRejectedValueOnce(ENOENT());

    await scaffoldWorkspaceRoot('/project', 'wiz', 'core');

    expect(writtenPkg().scripts).toEqual({ build: 'custom build command' });
  });

  it('builds the core package first for npm, since --workspaces has no topological order', async () => {
    nypm.detectPackageManager.mockResolvedValue({ name: 'npm' });
    // npm (unlike pnpm) never reads pnpm-workspace.yaml, so only one readFile call happens here.
    fsPromises.readFile.mockRejectedValueOnce(ENOENT());

    await scaffoldWorkspaceRoot('/project', 'wiz', 'core');

    expect(writtenPkg().scripts).toEqual({
      build: 'npm run build -w packages/core && npm run build --workspaces --if-present',
    });
  });
});

describe('writeIndexHtml', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsPromises.writeFile.mockResolvedValue(undefined);
    fsPromises.mkdir.mockResolvedValue(undefined);
    fsPromises.readFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
  });

  it('writes the given content to src/index.html', async () => {
    await writeIndexHtml('/project', '<!doctype html>\n');

    expect(fsPromises.mkdir).toHaveBeenCalledWith(join('/project', 'src'), { recursive: true });
    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      join('/project', 'src', 'index.html'),
      '<!doctype html>\n',
      { encoding: 'utf8', flag: 'wx' },
    );
  });

  it('does not overwrite an existing src/index.html', async () => {
    fsPromises.writeFile.mockRejectedValue(Object.assign(new Error('EEXIST'), { code: 'EEXIST' }));

    await expect(writeIndexHtml('/project', '<!doctype html>\n')).resolves.toBeUndefined();
  });
});

// Fake a single file entry from readdir({ withFileTypes: true })
function makeDirent(name: string, parentPath: string) {
  return { isFile: () => true, name, parentPath };
}

describe('copyTemplate — package.json merge', () => {
  const TEMPLATE_PKG = JSON.stringify({
    name: '{{PROJECT_NAME}}',
    version: '0.0.1',
    devDependencies: { '@stencil/core': '{{STENCIL_VERSION}}' },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fsPromises.writeFile.mockResolvedValue(undefined);
    fsPromises.mkdir.mockResolvedValue(undefined);
    fsPromises.readdir.mockResolvedValue([makeDirent('package.json', '/template')]);
    // First readFile call: template source. Second: existing dest.
    fsPromises.readFile.mockResolvedValueOnce(TEMPLATE_PKG);
  });

  it('does not add a package to devDependencies when it is already in dependencies', async () => {
    const existing = {
      name: 'my-app',
      dependencies: { '@stencil/core': 'link:../local/packages/core' },
    };
    fsPromises.readFile.mockResolvedValueOnce(JSON.stringify(existing));

    await copyTemplate('/project', 'my-app', 'MyApp');

    const written = JSON.parse(vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string);
    expect(written.devDependencies).not.toHaveProperty('@stencil/core');
    expect(written.dependencies['@stencil/core']).toBe('link:../local/packages/core');
  });

  it('pins the provided stencil version in devDependencies (no caret)', async () => {
    const existing = { name: 'my-app' };
    fsPromises.readFile.mockResolvedValueOnce(JSON.stringify(existing));

    await copyTemplate('/project', 'my-app', 'MyApp', '5.0.0-alpha.8');

    const written = JSON.parse(vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string);
    expect(written.devDependencies['@stencil/core']).toBe('5.0.0-alpha.8');
  });

  it('falls back to ^5.0.0 when no stencil version is provided', async () => {
    const existing = { name: 'my-app' };
    fsPromises.readFile.mockResolvedValueOnce(JSON.stringify(existing));

    await copyTemplate('/project', 'my-app', 'MyApp');

    const written = JSON.parse(vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string);
    expect(written.devDependencies['@stencil/core']).toBe('^5.0.0');
  });
});

describe('copyTemplate — .gitignore rename', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsPromises.writeFile.mockResolvedValue(undefined);
    fsPromises.mkdir.mockResolvedValue(undefined);
  });

  it("writes the template's `_gitignore` to `.gitignore` at the destination", async () => {
    // npm strips real .gitignore files from published packages, so the template ships one
    // named `_gitignore` - copyTemplate must rename it back on the way out.
    fsPromises.readdir.mockResolvedValue([makeDirent('_gitignore', '/template')]);
    fsPromises.readFile
      .mockResolvedValueOnce('node_modules/\ndist/\n') // template source
      .mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })); // no existing dest file

    await copyTemplate('/project', 'my-app', 'MyApp');

    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      join('/project', '.gitignore'),
      'node_modules/\ndist/\n',
      'utf8',
    );
  });

  it('merges into an existing .gitignore instead of overwriting it', async () => {
    fsPromises.readdir.mockResolvedValue([makeDirent('_gitignore', '/template')]);
    fsPromises.readFile
      .mockResolvedValueOnce('node_modules/\ndist/\n')
      .mockResolvedValueOnce('node_modules/\n.env\n');

    await copyTemplate('/project', 'my-app', 'MyApp');

    expect(fsPromises.writeFile).toHaveBeenCalledWith(
      join('/project', '.gitignore'),
      'node_modules/\n.env\ndist/\n',
      'utf8',
    );
  });
});
