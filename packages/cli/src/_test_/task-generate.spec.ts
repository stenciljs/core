import { mockCompilerSystem, mockValidatedConfig } from '@stencil/core/testing';
import { vi, describe, it, expect, afterEach, afterAll } from 'vitest';

import type * as d from '@stencil/core';
import * as utils from '@stencil/core/compiler/utils';
import { createConfigFlags, type ConfigFlags } from '../config-flags';
import { BoilerplateFile, getBoilerplateByExtension, taskGenerate } from '../task-generate';

const promptMock = vi.hoisted(() => vi.fn().mockResolvedValue('my-component'));

vi.mock('prompts', () => ({
  prompt: promptMock,
}));

let formatToPick = 'css';

const setup = async (plugins: any[] = []) => {
  const sys = mockCompilerSystem();
  const flags = createConfigFlags({ task: 'generate', unknownArgs: [] });
  const config: d.ValidatedConfig = mockValidatedConfig({
    configPath: '/testing-path',
    srcDir: '/src',
    sys,
    plugins,
  });

  // set up some mocks / spies
  config.sys.exit = vi.fn();
  const errorSpy = vi.spyOn(config.logger, 'error');
  const validateTagSpy = vi.spyOn(utils, 'validateComponentTag').mockReturnValue(undefined);

  // mock prompt usage: tagName and filesToGenerate are the keys used for
  // different calls, so we can cheat here and just do a single
  // mockResolvedValue
  let format = formatToPick;
  promptMock.mockImplementation((params) => {
    if (params.name === 'sassFormat') {
      format = 'sass';
      return { sassFormat: 'sass' };
    }
    return {
      tagName: 'my-component',
      filesToGenerate: [format, 'spec.tsx', 'e2e.ts'],
    };
  });

  return { config, flags, errorSpy, validateTagSpy };
};

/**
 * Little test helper function which just temporarily silences
 * console.log calls, so we can avoid spewing a bunch of stuff.
 * @param config the user-supplied config to forward to `taskGenerate`
 * @param flags the CLI flags to forward to `taskGenerate`
 */
async function silentGenerate(config: d.ValidatedConfig, flags: ConfigFlags): Promise<void> {
  const tmp = console.log;
  console.log = vi.fn();
  await taskGenerate(config, flags);
  console.log = tmp;
}

describe('generate task', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.resetModules();
    formatToPick = 'css';
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  it('should exit with an error if no `configPath` is supplied', async () => {
    const { config, flags, errorSpy } = await setup();
    config.configPath = undefined;
    await taskGenerate(config, flags);
    expect(config.sys.exit).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      'Please run this command in your root directory (i. e. the one containing stencil.config.ts).',
    );
  });

  it('should exit with an error if no `srcDir` is supplied', async () => {
    const { config, flags, errorSpy } = await setup();
    // @ts-expect-error force srcDir to be undefined to trigger the error case
    config.srcDir = undefined;
    await taskGenerate(config, flags);
    expect(config.sys.exit).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith("Stencil's srcDir was not specified.");
  });

  it('should exit with an error if the component name does not validate', async () => {
    const { config, flags, errorSpy, validateTagSpy } = await setup();
    validateTagSpy.mockReturnValue('error error error');
    await taskGenerate(config, flags);
    expect(config.sys.exit).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('error error error');
  });

  it.each([true, false])('should create a directory for the generated components', async (includeTests) => {
    const { config, flags } = await setup();
    if (!includeTests) {
      promptMock.mockResolvedValue({
        tagName: 'my-component',
        // simulate the user picking only the css option
        filesToGenerate: ['css'],
      });
    }

    const createDirSpy = vi.spyOn(config.sys, 'createDir');
    await silentGenerate(config, flags);
    expect(createDirSpy).toHaveBeenCalledWith(
      includeTests ? `${config.srcDir}/components/my-component/test` : `${config.srcDir}/components/my-component`,
      { recursive: true },
    );
  });

  it('should generate the files the user picked', async () => {
    const { config, flags } = await setup();
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');
    await silentGenerate(config, flags);
    const userChoices: ReadonlyArray<BoilerplateFile> = [
      { extension: 'tsx', path: '/src/components/my-component/my-component.tsx' },
      { extension: 'css', path: '/src/components/my-component/my-component.css' },
      { extension: 'spec.tsx', path: '/src/components/my-component/test/my-component.spec.tsx' },
      { extension: 'e2e.ts', path: '/src/components/my-component/test/my-component.e2e.ts' },
    ];

    userChoices.forEach((file) => {
      expect(writeFileSpy).toHaveBeenCalledWith(
        file.path,
        getBoilerplateByExtension('my-component', file.extension, true, 'css'),
      );
    });
  });

  it('should error without writing anything if a to-be-generated file is already present', async () => {
    const { config, flags, errorSpy } = await setup();
    vi.spyOn(config.sys, 'readFile').mockResolvedValue('some file contents');
    await silentGenerate(config, flags);
    expect(errorSpy).toHaveBeenCalledWith(
      'Generating code would overwrite the following files:',
      '\t/src/components/my-component/my-component.tsx',
      '\t/src/components/my-component/my-component.css',
      '\t/src/components/my-component/test/my-component.spec.tsx',
      '\t/src/components/my-component/test/my-component.e2e.ts',
    );
    expect(config.sys.exit).toHaveBeenCalledWith(1);
  });

  it('should generate files for sass projects', async () => {
    const { config, flags } = await setup([{ name: 'sass' }]);
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');
    await silentGenerate(config, flags);
    const userChoices: ReadonlyArray<BoilerplateFile> = [
      { extension: 'tsx', path: '/src/components/my-component/my-component.tsx' },
      { extension: 'sass', path: '/src/components/my-component/my-component.sass' },
      { extension: 'spec.tsx', path: '/src/components/my-component/test/my-component.spec.tsx' },
      { extension: 'e2e.ts', path: '/src/components/my-component/test/my-component.e2e.ts' },
    ];

    userChoices.forEach((file) => {
      expect(writeFileSpy).toHaveBeenCalledWith(
        file.path,
        getBoilerplateByExtension('my-component', file.extension, true, 'sass'),
      );
    });
  });

  it('should generate files for less projects', async () => {
    formatToPick = 'less';
    const { config, flags } = await setup([{ name: 'less' }]);
    const writeFileSpy = vi.spyOn(config.sys, 'writeFile');
    await silentGenerate(config, flags);
    const userChoices: ReadonlyArray<BoilerplateFile> = [
      { extension: 'tsx', path: '/src/components/my-component/my-component.tsx' },
      { extension: 'less', path: '/src/components/my-component/my-component.less' },
      { extension: 'spec.tsx', path: '/src/components/my-component/test/my-component.spec.tsx' },
      { extension: 'e2e.ts', path: '/src/components/my-component/test/my-component.e2e.ts' },
    ];

    userChoices.forEach((file) => {
      expect(writeFileSpy).toHaveBeenCalledWith(
        file.path,
        getBoilerplateByExtension('my-component', file.extension, true, 'less'),
      );
    });
  });
});
