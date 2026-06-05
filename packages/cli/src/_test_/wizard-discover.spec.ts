import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { discoverPlugins } from '../wizard/discover';

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }));

import { readFile } from 'node:fs/promises';
const mockReadFile = readFile as ReturnType<typeof vi.fn>;

const ROOT = '/project';

function makeRootPkg(
  deps: Record<string, string> = {},
  devDeps: Record<string, string> = {},
): string {
  return JSON.stringify({ dependencies: deps, devDependencies: devDeps });
}

function makeDepPkg(wizardEntry?: string): string {
  return JSON.stringify(wizardEntry ? { stencil: { wizard: wizardEntry } } : {});
}

function makeLoader(modules: Record<string, Record<string, unknown>> = {}) {
  return vi.fn(async (url: string) => {
    // strip file:// prefix for lookup convenience
    const path = url.replace(/^file:\/\//, '');
    if (path in modules) return modules[path];
    throw new Error(`Module not found: ${url}`);
  });
}

describe('discoverPlugins', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    mockReadFile
      .mockResolvedValueOnce(makeRootPkg({ '@stencil/vitest': '^1.0.0' }))
      .mockResolvedValueOnce(makeDepPkg(/* no wizard */));

    const result = await discoverPlugins(ROOT, makeLoader());
    expect(result).toEqual([]);
  });

  it('discovers a plugin from dependencies', async () => {
    const plugin = { generate: { fileTemplates: [] } };
    mockReadFile
      .mockResolvedValueOnce(makeRootPkg({ '@stencil/vitest': '^1.0.0' }))
      .mockResolvedValueOnce(makeDepPkg('./dist/wizard.js'));

    const wizardPath = `${ROOT}/node_modules/@stencil/vitest/dist/wizard.js`;
    const loader = makeLoader({ [wizardPath]: { wizard: plugin } });

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toEqual([{ packageName: '@stencil/vitest', plugin }]);
  });

  it('discovers plugins from both dependencies and devDependencies', async () => {
    const pluginA = { generate: { fileTemplates: [] } };
    const pluginB = { init: { id: 'sass', displayName: 'Sass', description: '' } };
    mockReadFile
      .mockResolvedValueOnce(
        makeRootPkg({ '@stencil/vitest': '^1.0.0' }, { '@stencil/sass': '^3.0.0' }),
      )
      .mockResolvedValueOnce(makeDepPkg('./dist/wizard.js')) // @stencil/vitest
      .mockResolvedValueOnce(makeDepPkg('./dist/wizard.js')); // @stencil/sass

    const loader = makeLoader({
      [`${ROOT}/node_modules/@stencil/vitest/dist/wizard.js`]: { wizard: pluginA },
      [`${ROOT}/node_modules/@stencil/sass/dist/wizard.js`]: { wizard: pluginB },
    });

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.packageName === '@stencil/vitest')?.plugin).toBe(pluginA);
    expect(result.find((r) => r.packageName === '@stencil/sass')?.plugin).toBe(pluginB);
  });

  it('skips a plugin whose module fails to load and warns', async () => {
    mockReadFile
      .mockResolvedValueOnce(makeRootPkg({ '@stencil/vitest': '^1.0.0' }))
      .mockResolvedValueOnce(makeDepPkg('./dist/wizard.js'));

    const loader = makeLoader(/* no matching module */);

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('@stencil/vitest'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('failed to load'));
  });

  it('skips a plugin that does not export wizard and warns', async () => {
    mockReadFile
      .mockResolvedValueOnce(makeRootPkg({ '@stencil/vitest': '^1.0.0' }))
      .mockResolvedValueOnce(makeDepPkg('./dist/wizard.js'));

    const wizardPath = `${ROOT}/node_modules/@stencil/vitest/dist/wizard.js`;
    const loader = makeLoader({ [wizardPath]: { notWizard: {} } });

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("does not export a 'wizard' object"),
    );
  });

  it('does not fail when one plugin errors and others succeed', async () => {
    const plugin = { generate: { fileTemplates: [] } };
    mockReadFile
      .mockResolvedValueOnce(
        makeRootPkg({ '@stencil/vitest': '^1.0.0', '@stencil/broken': '^1.0.0' }),
      )
      .mockResolvedValueOnce(makeDepPkg('./dist/wizard.js')) // @stencil/vitest
      .mockResolvedValueOnce(makeDepPkg('./dist/wizard.js')); // @stencil/broken

    const loader = makeLoader({
      [`${ROOT}/node_modules/@stencil/vitest/dist/wizard.js`]: { wizard: plugin },
      // @stencil/broken deliberately omitted → load fails
    });

    const result = await discoverPlugins(ROOT, loader);
    expect(result).toEqual([{ packageName: '@stencil/vitest', plugin }]);
  });
});
