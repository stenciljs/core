import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { discoverPlugins } from '../wizard/discover';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));
vi.mock('local-pkg', () => ({ getPackageInfo: vi.fn() }));

import { readFile } from 'node:fs/promises';
import { getPackageInfo } from 'local-pkg';
const mockReadFile = readFile as ReturnType<typeof vi.fn>;
const mockGetPackageInfo = getPackageInfo as ReturnType<typeof vi.fn>;

const ROOT = '/project';

function makeRootPkg(
  deps: Record<string, string> = {},
  devDeps: Record<string, string> = {},
): string {
  return JSON.stringify({ dependencies: deps, devDependencies: devDeps });
}

// Mirrors how `loadOne` in wizard/discover.ts derives a package's install dir.
function pluginRootPath(packageName: string): string {
  return join(ROOT, 'node_modules', packageName);
}

// Mirrors `join(info.rootPath, wizardEntry)` in wizard/discover.ts.
function pluginWizardPath(packageName: string, wizardEntry = './dist/wizard.js'): string {
  return join(pluginRootPath(packageName), wizardEntry);
}

/** Registers a resolvable package at `${ROOT}/node_modules/${packageName}`, optionally declaring a wizard entry. */
function mockResolvedPackage(packageName: string, wizardEntry?: string) {
  const rootPath = pluginRootPath(packageName);
  mockGetPackageInfo.mockImplementation((name: string) => {
    if (name !== packageName) return Promise.resolve(undefined);
    return Promise.resolve({
      name,
      version: '1.0.0',
      rootPath,
      packageJsonPath: join(rootPath, 'package.json'),
      packageJson: wizardEntry ? { stencil: { wizard: wizardEntry } } : {},
    });
  });
}

// Keys (native fs paths) are converted to file:// URLs up front via the same `pathToFileURL`
// call wizard/discover.ts makes, so comparison happens at the URL level. Round-tripping the
// incoming URL back to a path instead (via fileURLToPath) doesn't work: on Windows,
// pathToFileURL fills in a drive letter for driveless-rooted paths, and that only happens on
// one side unless both sides go through the exact same forward transform.
function makeLoader(modules: Record<string, Record<string, unknown>> = {}) {
  const urlModules = new Map(
    Object.entries(modules).map(([path, mod]) => [pathToFileURL(path).href, mod]),
  );
  return vi.fn(async (url: string) => {
    if (urlModules.has(url)) return urlModules.get(url);
    throw new Error(`Module not found: ${url}`);
  });
}

describe('discoverPlugins', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockGetPackageInfo.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when project has no package.json', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    const result = await discoverPlugins(ROOT);
    expect(result).toEqual([]);
  });

  it('returns empty array when no deps declare stencil.wizard', async () => {
    mockReadFile.mockResolvedValueOnce(makeRootPkg({ '@stencil/vitest': '^1.0.0' }));
    mockResolvedPackage('@stencil/vitest' /* no wizard */);

    const result = await discoverPlugins(ROOT, makeLoader());
    expect(result).toEqual([]);
  });

  it('returns empty array when a dep cannot be resolved at all', async () => {
    mockReadFile.mockResolvedValueOnce(makeRootPkg({ '@stencil/vitest': '^1.0.0' }));
    // mockGetPackageInfo already defaults to resolving undefined

    const result = await discoverPlugins(ROOT, makeLoader());
    expect(result).toEqual([]);
  });

  it('discovers a plugin from dependencies, resolved via node module resolution', async () => {
    const plugin = { generate: { fileTemplates: [] } };
    mockReadFile.mockResolvedValueOnce(makeRootPkg({ '@stencil/vitest': '^1.0.0' }));
    mockResolvedPackage('@stencil/vitest', './dist/wizard.js');

    const wizardPath = pluginWizardPath('@stencil/vitest');
    const loader = makeLoader({ [wizardPath]: { wizard: plugin } });

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toEqual([{ packageName: '@stencil/vitest', plugin }]);
    // rootDir is passed through as a resolution path, so hoisted deps (workspace root
    // node_modules) resolve correctly, not just a literal rootDir/node_modules join
    expect(mockGetPackageInfo).toHaveBeenCalledWith('@stencil/vitest', { paths: [ROOT] });
  });

  it('discovers plugins from both dependencies and devDependencies', async () => {
    const pluginA = { generate: { fileTemplates: [] } };
    const pluginB = { init: { id: 'sass', displayName: 'Sass', description: '' } };
    mockReadFile.mockResolvedValueOnce(
      makeRootPkg({ '@stencil/vitest': '^1.0.0' }, { '@stencil/sass': '^3.0.0' }),
    );
    mockGetPackageInfo.mockImplementation((name: string) => {
      const wizardEntry = './dist/wizard.js';
      if (name !== '@stencil/vitest' && name !== '@stencil/sass') return Promise.resolve(undefined);
      const rootPath = pluginRootPath(name);
      return Promise.resolve({
        name,
        version: '1.0.0',
        rootPath,
        packageJsonPath: join(rootPath, 'package.json'),
        packageJson: { stencil: { wizard: wizardEntry } },
      });
    });

    const loader = makeLoader({
      [pluginWizardPath('@stencil/vitest')]: { wizard: pluginA },
      [pluginWizardPath('@stencil/sass')]: { wizard: pluginB },
    });

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.packageName === '@stencil/vitest')?.plugin).toBe(pluginA);
    expect(result.find((r) => r.packageName === '@stencil/sass')?.plugin).toBe(pluginB);
  });

  it('skips a plugin whose module fails to load and warns', async () => {
    mockReadFile.mockResolvedValueOnce(makeRootPkg({ '@stencil/vitest': '^1.0.0' }));
    mockResolvedPackage('@stencil/vitest', './dist/wizard.js');

    const loader = makeLoader(/* no matching module */);

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('@stencil/vitest'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('failed to load'));
  });

  it('skips a plugin that does not export wizard and warns', async () => {
    mockReadFile.mockResolvedValueOnce(makeRootPkg({ '@stencil/vitest': '^1.0.0' }));
    mockResolvedPackage('@stencil/vitest', './dist/wizard.js');

    const wizardPath = pluginWizardPath('@stencil/vitest');
    const loader = makeLoader({ [wizardPath]: { notWizard: {} } });

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("does not export a 'wizard' object"),
    );
  });

  it('does not fail when one plugin errors and others succeed', async () => {
    const plugin = { generate: { fileTemplates: [] } };
    mockReadFile.mockResolvedValueOnce(
      makeRootPkg({ '@stencil/vitest': '^1.0.0', '@stencil/broken': '^1.0.0' }),
    );
    mockGetPackageInfo.mockImplementation((name: string) => {
      if (name !== '@stencil/vitest' && name !== '@stencil/broken')
        return Promise.resolve(undefined);
      const rootPath = pluginRootPath(name);
      return Promise.resolve({
        name,
        version: '1.0.0',
        rootPath,
        packageJsonPath: join(rootPath, 'package.json'),
        packageJson: { stencil: { wizard: './dist/wizard.js' } },
      });
    });

    const loader = makeLoader({
      [pluginWizardPath('@stencil/vitest')]: { wizard: plugin },
      // @stencil/broken deliberately omitted → load fails
    });

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toEqual([{ packageName: '@stencil/vitest', plugin }]);
  });

  describe('STENCIL_WIZARD_DEV', () => {
    const DEV_WIZARD = '/path/to/my-plugin/dist/wizard.js';
    // Mirrors `resolve(rootDir, devPath)` in wizard/discover.ts.
    const devWizardPath = resolve(ROOT, DEV_WIZARD);
    const devPlugin = {
      init: { id: 'my-plugin', displayName: 'My Plugin', description: '', run: vi.fn() },
    };

    beforeEach(() => {
      vi.stubEnv('STENCIL_WIZARD_DEV', DEV_WIZARD);
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('prepends dev wizard to results (no normal deps)', async () => {
      mockReadFile
        .mockResolvedValueOnce(makeRootPkg()) // root pkg, no deps
        .mockRejectedValueOnce(new Error('ENOENT')) // dist/package.json not found
        .mockResolvedValueOnce(JSON.stringify({ name: 'my-plugin' })); // parent package.json

      const loader = makeLoader({ [devWizardPath]: { wizard: devPlugin } });

      const result = await discoverPlugins(ROOT, loader);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ packageName: 'my-plugin', plugin: devPlugin });
    });

    it('prepends dev wizard before normally discovered plugins', async () => {
      const installedPlugin = { generate: { fileTemplates: [] } };
      mockReadFile
        .mockResolvedValueOnce(makeRootPkg({ '@stencil/sass': '^3.0.0' }))
        .mockRejectedValueOnce(new Error('ENOENT')) // dist/package.json not found
        .mockResolvedValueOnce(JSON.stringify({ name: 'my-plugin' })); // parent package.json
      mockResolvedPackage('@stencil/sass', './dist/wizard.js');

      const loader = makeLoader({
        [pluginWizardPath('@stencil/sass')]: { wizard: installedPlugin },
        [devWizardPath]: { wizard: devPlugin },
      });

      const result = await discoverPlugins(ROOT, loader);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ packageName: 'my-plugin', plugin: devPlugin });
      expect(result[1]).toEqual({ packageName: '@stencil/sass', plugin: installedPlugin });
    });

    it('replaces the installed version when dev wizard package name matches', async () => {
      // Simulates developing @stencil/vitest while it is already installed
      const installedPlugin = { generate: { fileTemplates: [] } };
      mockReadFile
        .mockResolvedValueOnce(makeRootPkg({ 'my-plugin': '^1.0.0' }))
        .mockRejectedValueOnce(new Error('ENOENT')) // dev: dist/package.json not found
        .mockResolvedValueOnce(JSON.stringify({ name: 'my-plugin' })); // dev: parent package.json
      mockResolvedPackage('my-plugin', './dist/wizard.js');

      const loader = makeLoader({
        [pluginWizardPath('my-plugin')]: { wizard: installedPlugin },
        [devWizardPath]: { wizard: devPlugin },
      });

      const result = await discoverPlugins(ROOT, loader);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ packageName: 'my-plugin', plugin: devPlugin });
    });

    it('falls back to directory name when no package.json is found', async () => {
      mockReadFile
        .mockResolvedValueOnce(makeRootPkg())
        .mockRejectedValueOnce(new Error('ENOENT')) // dist/package.json
        .mockRejectedValueOnce(new Error('ENOENT')); // parent package.json

      const loader = makeLoader({ [devWizardPath]: { wizard: devPlugin } });

      const result = await discoverPlugins(ROOT, loader);
      expect(result[0].packageName).toBe('dist'); // dirname of wizard.js
    });

    it('warns and omits dev wizard when the file fails to load', async () => {
      mockReadFile
        .mockResolvedValueOnce(makeRootPkg())
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce(JSON.stringify({ name: 'my-plugin' }));

      const loader = makeLoader(/* DEV_WIZARD not included → throws */);

      const result = await discoverPlugins(ROOT, loader);
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('STENCIL_WIZARD_DEV'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('failed to load'));
    });

    it('warns and omits dev wizard when it does not export a wizard object', async () => {
      mockReadFile
        .mockResolvedValueOnce(makeRootPkg())
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce(JSON.stringify({ name: 'my-plugin' }));

      const loader = makeLoader({ [devWizardPath]: { notWizard: {} } });

      const result = await discoverPlugins(ROOT, loader);
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("does not export a 'wizard' object"),
      );
    });
  });
});
