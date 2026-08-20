import * as utils from '@stencil/core/compiler/utils';
import { mockCompilerSystem, mockValidatedConfig } from '@stencil/core/testing';
import {
  getComponentBoilerplate,
  getPreviewHtmlBoilerplate,
  getStyleBoilerplate,
  getUsageExampleBoilerplate,
  toPascalCase,
} from '@stencil/templates';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type * as d from '@stencil/core/compiler';

import { createConfigFlags, type ConfigFlags } from '../config-flags';
import { resolveEntryScriptSrc } from '../resolve-entry-script';
import { taskGenerate } from '../task-generate';

// --- mocks ---

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  note: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
}));

vi.mock('../wizard/discover', () => ({
  discoverPlugins: vi.fn().mockResolvedValue([]),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

import { existsSync } from 'node:fs';
import * as clack from '@clack/prompts';

import { discoverPlugins } from '../wizard/discover';

const mockSelect = vi.mocked(clack.select);
const mockText = vi.mocked(clack.text);
const mockMultiselect = vi.mocked(clack.multiselect);
const mockDiscoverPlugins = vi.mocked(discoverPlugins);

// --- helpers ---

const ROOT = '/project';
const SRC = '/project/src';

function setup(plugins: d.ValidatedConfig['plugins'] = []) {
  const sys = mockCompilerSystem();
  const flags: ConfigFlags = createConfigFlags({ task: 'generate', unknownArgs: [] });
  const config: d.ValidatedConfig = mockValidatedConfig({
    configPath: `${ROOT}/stencil.config.ts`,
    rootDir: ROOT,
    srcDir: SRC,
    sys,
    plugins,
  });
  config.sys.exit = vi.fn();
  const errorSpy = vi.spyOn(config.logger, 'error');
  vi.spyOn(utils, 'validateComponentTag').mockReturnValue(undefined);
  return { config, flags, errorSpy };
}

function withTagName(flags: ConfigFlags, name: string) {
  flags.unknownArgs = [name];
}

// Default prompt answers: CSS stylesheet, no plugin file templates
function defaultPrompts() {
  mockSelect.mockResolvedValue('css');
  mockMultiselect.mockResolvedValue([]);
}

// --- tests ---

describe('generate task', () => {
  beforeEach(() => {
    mockDiscoverPlugins.mockResolvedValue([]);
    vi.mocked(existsSync).mockReturnValue(true);
    defaultPrompts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('exits with error when srcDir does not exist on disk', async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const { config, flags, errorSpy } = setup();
    await taskGenerate(config, flags);
    expect(config.sys.exit).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('project root'));
  });

  it('runs without a stencil.config.ts when srcDir exists', async () => {
    const { config, flags } = setup();
    config.configPath = undefined;
    withTagName(flags, 'my-component');
    await taskGenerate(config, flags);
    expect(config.sys.exit).not.toHaveBeenCalled();
  });

  it('exits with error when srcDir is missing or does not exist', async () => {
    const { config, flags, errorSpy } = setup();
    config.srcDir = undefined;
    await taskGenerate(config, flags);
    expect(config.sys.exit).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('project root'));
  });

  it('exits with error when the component tag is invalid', async () => {
    const { config, flags, errorSpy } = setup();
    vi.mocked(utils.validateComponentTag).mockReturnValue('bad tag');
    withTagName(flags, 'bad');
    await taskGenerate(config, flags);
    expect(errorSpy).toHaveBeenCalledWith('bad tag');
    expect(config.sys.exit).toHaveBeenCalledWith(1);
  });

  it('prompts for tag name when not supplied as CLI arg', async () => {
    const { config, flags } = setup();
    mockText.mockResolvedValue('my-component');
    await taskGenerate(config, flags);
    expect(mockText).toHaveBeenCalled();
  });

  it('skips tag name prompt when supplied as CLI arg', async () => {
    const { config, flags } = setup();
    withTagName(flags, 'my-button');
    await taskGenerate(config, flags);
    expect(mockText).not.toHaveBeenCalled();
  });

  it('generates tsx + css files when user picks CSS stylesheet', async () => {
    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');

    await taskGenerate(config, flags);

    expect(writeFileSpy).toHaveBeenCalledWith(
      `${SRC}/components/my-component/my-component.tsx`,
      getComponentBoilerplate('my-component', 'css'),
    );
    expect(writeFileSpy).toHaveBeenCalledWith(
      `${SRC}/components/my-component/my-component.css`,
      getStyleBoilerplate('css'),
    );
  });

  it('generates only tsx when user picks None stylesheet', async () => {
    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    mockSelect.mockResolvedValue('');
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');

    await taskGenerate(config, flags);

    expect(writeFileSpy).toHaveBeenCalledWith(
      `${SRC}/components/my-component/my-component.tsx`,
      getComponentBoilerplate('my-component', undefined),
    );
    expect(writeFileSpy).toHaveBeenCalledTimes(1);
  });

  it('creates directories for all generated files', async () => {
    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    const createDirSpy = vi.spyOn(config.sys, 'createDir');

    await taskGenerate(config, flags);

    expect(createDirSpy).toHaveBeenCalledWith(`${SRC}/components/my-component`, {
      recursive: true,
    });
  });

  it('generates no demo file by default', async () => {
    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    mockSelect.mockResolvedValueOnce('css').mockResolvedValueOnce('');
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');

    await taskGenerate(config, flags);

    expect(writeFileSpy).toHaveBeenCalledTimes(2); // tsx + css only
  });

  it('generates usage/example.md when the usage example demo is picked', async () => {
    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    mockSelect.mockResolvedValueOnce('css').mockResolvedValueOnce('usage');
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');

    await taskGenerate(config, flags);

    expect(writeFileSpy).toHaveBeenCalledWith(
      `${SRC}/components/my-component/usage/example.md`,
      getUsageExampleBoilerplate('my-component'),
    );
  });

  it('generates a component-scoped index.html when the preview page demo is picked', async () => {
    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    mockSelect.mockResolvedValueOnce('css').mockResolvedValueOnce('preview');
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');

    await taskGenerate(config, flags);

    expect(writeFileSpy).toHaveBeenCalledWith(
      `${SRC}/components/my-component/index.html`,
      getPreviewHtmlBoilerplate('my-component', resolveEntryScriptSrc(config)),
    );
  });

  it('resolves the entry script src from the project output targets for the preview page', async () => {
    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    config.outputTargets = [
      { type: 'www', dir: `${ROOT}/www`, buildDir: `${ROOT}/www/build` } as d.OutputTargetWww,
    ];
    mockSelect.mockResolvedValueOnce('css').mockResolvedValueOnce('preview');
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');

    await taskGenerate(config, flags);

    const [, written] = vi
      .mocked(writeFileSpy)
      .mock.calls.find(([absPath]) => absPath === `${SRC}/components/my-component/index.html`)!;
    expect(written).toContain('<script type="module" src="/build/testing.js"></script>');
  });

  it('errors without writing when files would be overwritten', async () => {
    const { config, flags, errorSpy } = setup();
    withTagName(flags, 'my-component');
    vi.spyOn(config.sys, 'readFile').mockResolvedValue('existing content');

    await taskGenerate(config, flags);

    expect(errorSpy).toHaveBeenCalledWith(
      'Generating code would overwrite the following files:',
      expect.stringContaining('my-component.tsx'),
      expect.stringContaining('my-component.css'),
    );
    expect(config.sys.exit).toHaveBeenCalledWith(1);
  });

  it('generates files from plugin fileTemplates when picked', async () => {
    const specTemplate = vi.fn().mockReturnValue('// spec content');
    mockDiscoverPlugins.mockResolvedValue([
      {
        packageName: '@stencil/vitest',
        plugin: {
          generate: {
            fileTemplates: [
              {
                label: 'Vitest spec (.spec.tsx)',
                extension: 'spec.tsx',
                subdirectory: 'test',
                template: specTemplate,
              },
            ],
          },
        },
      },
    ]);
    mockMultiselect.mockResolvedValue(['spec.tsx']);

    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');

    await taskGenerate(config, flags);

    expect(specTemplate).toHaveBeenCalledWith('my-component', toPascalCase('my-component'));
    expect(writeFileSpy).toHaveBeenCalledWith(
      `${SRC}/components/my-component/test/my-component.spec.tsx`,
      '// spec content',
    );
  });

  it('offers plugin style extensions in the style select', async () => {
    mockDiscoverPlugins.mockResolvedValue([
      {
        packageName: '@stencil/sass',
        plugin: { generate: { styleExtensions: ['scss', 'sass'] } },
      },
    ]);
    mockSelect.mockResolvedValue('scss');

    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');

    await taskGenerate(config, flags);

    const selectCall = mockSelect.mock.calls[0][0] as { options: { value: string }[] };
    const values = selectCall.options.map((o) => o.value);
    expect(values).toContain('scss');
    expect(values).toContain('sass');

    expect(writeFileSpy).toHaveBeenCalledWith(
      `${SRC}/components/my-component/my-component.scss`,
      getStyleBoilerplate('scss'),
    );
  });

  it('skips the file template multiselect when no plugins contribute templates', async () => {
    const { config, flags } = setup();
    withTagName(flags, 'my-component');

    await taskGenerate(config, flags);

    expect(mockMultiselect).not.toHaveBeenCalled();
  });

  it('resolves fileTemplates from an async function and passes GenerateContext', async () => {
    const specTemplate = vi.fn().mockReturnValue('// spec content');
    const fileTemplatesFn = vi
      .fn()
      .mockResolvedValue([
        { label: 'Vitest spec (.spec.tsx)', extension: 'spec.tsx', template: specTemplate },
      ]);
    mockDiscoverPlugins.mockResolvedValue([
      { packageName: '@stencil/vitest', plugin: { generate: { fileTemplates: fileTemplatesFn } } },
    ]);
    mockMultiselect.mockResolvedValue(['spec.tsx']);

    const { config, flags } = setup();
    withTagName(flags, 'my-component');
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');

    await taskGenerate(config, flags);

    expect(fileTemplatesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        tagName: 'my-component',
        config: expect.objectContaining({ rootDir: ROOT, srcDir: SRC }),
      }),
    );
    expect(writeFileSpy).toHaveBeenCalledWith(
      `${SRC}/components/my-component/my-component.spec.tsx`,
      '// spec content',
    );
  });

  it('resolves fileTemplates from a sync function', async () => {
    const specTemplate = vi.fn().mockReturnValue('// spec content');
    const fileTemplatesFn = vi
      .fn()
      .mockReturnValue([
        { label: 'Spec (.spec.tsx)', extension: 'spec.tsx', template: specTemplate },
      ]);
    mockDiscoverPlugins.mockResolvedValue([
      { packageName: '@stencil/vitest', plugin: { generate: { fileTemplates: fileTemplatesFn } } },
    ]);
    mockMultiselect.mockResolvedValue(['spec.tsx']);

    const { config, flags } = setup();
    withTagName(flags, 'my-component');

    await taskGenerate(config, flags);

    expect(fileTemplatesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        tagName: 'my-component',
        config: expect.objectContaining({ rootDir: ROOT, srcDir: SRC }),
      }),
    );
    expect(specTemplate).toHaveBeenCalled();
  });
});
