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

import { applyPackageJsonFields, copyTemplate } from '../wizard/init/apply';

const PKG_PATH = '/project/package.json';

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

// Fake a single file entry from readdir({ withFileTypes: true })
function makeDirent(name: string, parentPath: string) {
  return { isFile: () => true, name, parentPath };
}

describe('copyTemplate — package.json merge', () => {
  const TEMPLATE_PKG = JSON.stringify({
    name: '{{PROJECT_NAME}}',
    version: '0.0.1',
    devDependencies: { '@stencil/core': '^5.0.0' },
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

  it('adds the package to devDependencies when it is not in dependencies', async () => {
    const existing = { name: 'my-app' };
    fsPromises.readFile.mockResolvedValueOnce(JSON.stringify(existing));

    await copyTemplate('/project', 'my-app', 'MyApp');

    const written = JSON.parse(vi.mocked(fsPromises.writeFile).mock.calls[0][1] as string);
    expect(written.devDependencies['@stencil/core']).toBe('^5.0.0');
  });
});
