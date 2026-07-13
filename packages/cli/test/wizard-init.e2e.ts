import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const clackMocks = vi.hoisted(() => ({
  text: vi.fn(),
  multiselect: vi.fn().mockResolvedValue([]),
  groupMultiselect: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
}));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  confirm: clackMocks.confirm,
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  cancel: vi.fn(),
  isCancel: clackMocks.isCancel,
  text: clackMocks.text,
  multiselect: clackMocks.multiselect,
  groupMultiselect: clackMocks.groupMultiselect,
}));

vi.mock('nypm', () => ({
  installDependencies: vi.fn().mockResolvedValue(undefined),
  addDevDependency: vi.fn().mockResolvedValue(undefined),
  detectPackageManager: vi.fn().mockResolvedValue({ name: 'npm' }),
}));
vi.mock('std-env', () => ({ isCI: false }));
// installDependencies/addDevDependency above are no-ops - pretend core resolved
// rather than tripping the post-install verification. Other packages still resolve for real so
// discoverPlugins continues to work end-to-end.
vi.mock('local-pkg', async (importOriginal) => {
  const actual = await importOriginal<typeof import('local-pkg')>();
  return {
    ...actual,
    getPackageInfo: vi.fn((name: string, options?: Parameters<typeof actual.getPackageInfo>[1]) =>
      name === '@stencil/core'
        ? Promise.resolve({ rootPath: '/fake' })
        : actual.getPackageInfo(name, options),
    ),
  };
});

import { taskInit } from '../src/task-init.js';

const FIXTURE_PLUGIN_DIR = fileURLToPath(new URL('./fixtures/wizard-plugin', import.meta.url));

async function installFixturePlugin(rootDir: string): Promise<void> {
  const dest = join(rootDir, 'node_modules', 'fixture-wizard-plugin');
  await mkdir(dest, { recursive: true });
  await cp(FIXTURE_PLUGIN_DIR, dest, { recursive: true });
}

describe('taskInit e2e', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'stencil-e2e-'));
    clackMocks.isCancel.mockReturnValue(false);
    clackMocks.confirm.mockResolvedValue(true);
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit:${code ?? 0}`);
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('new project', () => {
    beforeEach(() => {
      clackMocks.text.mockResolvedValue('my-e2e-lib');
      // outputs=standalone forces config generation; features and docs return empty
      clackMocks.multiselect
        .mockResolvedValueOnce(['standalone'])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      clackMocks.groupMultiselect.mockResolvedValue([]);
    });

    it('writes template files with correct name and namespace', async () => {
      await taskInit();

      const config = await readFile(join(tmpDir, 'stencil.config.ts'), 'utf8');
      expect(config).toContain("namespace: 'MyE2eLib'");
      expect(config).toContain("type: 'standalone'");

      const pkg = JSON.parse(await readFile(join(tmpDir, 'package.json'), 'utf8')) as {
        name: string;
      };
      expect(pkg.name).toBe('my-e2e-lib');

      const component = await readFile(
        join(tmpDir, 'src/components/my-component/my-component.tsx'),
        'utf8',
      );
      expect(component).toContain('@Component');

      const usageExample = await readFile(
        join(tmpDir, 'src/components/my-component/usage/example.md'),
        'utf8',
      );
      expect(usageExample).toContain('<my-component');
    });

    it('strips npm scope and PascalCases the namespace', async () => {
      clackMocks.text.mockResolvedValue('@my-org/my-e2e-lib');

      await taskInit();

      const config = await readFile(join(tmpDir, 'stencil.config.ts'), 'utf8');
      expect(config).toContain("namespace: 'MyE2eLib'");
    });
  });

  describe('existing project', () => {
    beforeEach(async () => {
      await writeFile(
        join(tmpDir, 'stencil.config.ts'),
        `import type { Config } from '@stencil/core';\nexport const config: Config = {};\n`,
        'utf8',
      );
      await writeFile(
        join(tmpDir, 'package.json'),
        JSON.stringify(
          { name: 'my-existing-project', devDependencies: { 'fixture-wizard-plugin': '1.0.0' } },
          null,
          2,
        ),
        'utf8',
      );
      await installFixturePlugin(tmpDir);
    });

    it('discovers the fixture plugin and calls its run(), which modifies the config', async () => {
      clackMocks.groupMultiselect.mockResolvedValue(['configure:fixture-wizard-plugin']);

      await taskInit();

      const config = await readFile(join(tmpDir, 'stencil.config.ts'), 'utf8');
      expect(config).toContain("import { fixturePlugin } from 'fixture-wizard-plugin';");
    });

    it('leaves stencil.config.ts unchanged when nothing is selected', async () => {
      clackMocks.groupMultiselect.mockResolvedValue([]);

      const original = await readFile(join(tmpDir, 'stencil.config.ts'), 'utf8');
      await taskInit();
      const after = await readFile(join(tmpDir, 'stencil.config.ts'), 'utf8');

      expect(after).toBe(original);
    });
  });
});
