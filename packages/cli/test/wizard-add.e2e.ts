import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: { warn: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

// Simulate addDevDependency writing the packages to package.json devDependencies,
// which discoverPlugins relies on to know which packages to scan.
vi.mock('nypm', () => ({
  addDevDependency: vi
    .fn()
    .mockImplementation(async (names: string | string[], { cwd }: { cwd: string }) => {
      const pkgPath = join(cwd, 'package.json');
      const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown>;
      const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;
      for (const name of Array.isArray(names) ? names : [names]) {
        devDeps[name] = '^1.0.0';
      }
      pkg.devDependencies = devDeps;
      await writeFile(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
    }),
}));
vi.mock('std-env', () => ({ isCI: false }));

import { taskAdd } from '../src/task-add.js';

const FIXTURE_PLUGIN_DIR = fileURLToPath(new URL('./fixtures/wizard-plugin', import.meta.url));

async function installFixturePlugin(rootDir: string): Promise<void> {
  const dest = join(rootDir, 'node_modules', 'fixture-wizard-plugin');
  await mkdir(dest, { recursive: true });
  await cp(FIXTURE_PLUGIN_DIR, dest, { recursive: true });
}

describe('taskAdd e2e', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stencil-add-e2e-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code ?? 0}`);
    });

    await writeFile(
      join(tmpDir, 'stencil.config.ts'),
      `import type { Config } from '@stencil/core';\nexport const config: Config = {};\n`,
      'utf8',
    );
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'my-project', devDependencies: {} }, null, 2),
      'utf8',
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('installs a package and runs its wizard', async () => {
    await installFixturePlugin(tmpDir);

    await taskAdd(['fixture-wizard-plugin']);

    const config = await readFile(join(tmpDir, 'stencil.config.ts'), 'utf8');
    expect(config).toContain("import { fixturePlugin } from 'fixture-wizard-plugin';");
  });

  it('installs a package with no wizard without errors', async () => {
    // no fixture plugin installed in node_modules - discoverPlugins will find nothing
    const original = await readFile(join(tmpDir, 'stencil.config.ts'), 'utf8');

    await taskAdd(['some-package-without-wizard']);

    const after = await readFile(join(tmpDir, 'stencil.config.ts'), 'utf8');
    expect(after).toBe(original);
  });
});
