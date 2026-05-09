import { mockValidatedConfig } from '@stencil/core/testing';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import type { OutputTargetStencilRebundle } from '@stencil/core';

import { ValidatedConfig } from '../../../compiler';
import { mapImportsToPathAliases } from '../map-imports-to-path-aliases';
import { transpileModule } from './transpile';

const { resolveModuleNameSpy } = vi.hoisted(() => {
  return {
    resolveModuleNameSpy: vi.fn(),
  };
});

vi.mock('typescript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('typescript')>();
  return {
    ...actual,
    default: {
      ...actual,
      resolveModuleName: resolveModuleNameSpy,
    },
  };
});

describe('mapImportsToPathAliases', () => {
  let module: ReturnType<typeof transpileModule>;
  let config: ValidatedConfig;
  let outputTarget: OutputTargetStencilRebundle;

  beforeEach(() => {
    config = mockValidatedConfig({ tsCompilerOptions: {} });

    outputTarget = {
      type: 'stencil-rebundle',
      dir: 'dist/collection',
      transformAliasedImportPaths: true,
    };
  });

  afterEach(() => {
    resolveModuleNameSpy.mockReset();
  });

  it('does nothing if the config flag is `false`', () => {
    outputTarget.transformAliasedImportPaths = false;
    resolveModuleNameSpy.mockReturnValue({
      resolvedModule: {
        isExternalLibraryImport: false,

        resolvedFileName: 'utils.js',
      },
    });
    const inputText = `
        import { utils } from "@utils/utils";

        utils.test();
    `;

    module = transpileModule(
      inputText,
      config,
      null,
      [],
      [mapImportsToPathAliases(config, '', outputTarget)],
    );

    expect(module.outputText).toContain('import { utils } from "@utils/utils";');
  });

  it('ignores relative imports', () => {
    resolveModuleNameSpy.mockReturnValue({
      resolvedModule: {
        isExternalLibraryImport: false,
        extension: '.ts',
        resolvedFileName: 'utils.js',
      },
    });
    const inputText = `
        import * as dateUtils from "../utils";

        dateUtils.test();
    `;

    module = transpileModule(
      inputText,
      config,
      null,
      [],
      [mapImportsToPathAliases(config, '', outputTarget)],
    );

    expect(module.outputText).toContain('import * as dateUtils from "../utils";');
  });

  it('ignores external imports', () => {
    resolveModuleNameSpy.mockReturnValue({
      resolvedModule: {
        isExternalLibraryImport: true,
        extension: '.ts',
        resolvedFileName: 'utils.js',
      },
    });
    const inputText = `
        import { utils } from "@stencil/core";

        utils.test();
    `;

    module = transpileModule(
      inputText,
      config,
      null,
      [],
      [mapImportsToPathAliases(config, '', outputTarget)],
    );

    expect(module.outputText).toContain('import { utils } from "@stencil/core";');
  });

  it('does nothing if there is no resolved module', () => {
    resolveModuleNameSpy.mockReturnValue({
      resolvedModule: undefined,
    });
    const inputText = `
        import { utils } from "@utils";

        utils.test();
    `;

    module = transpileModule(
      inputText,
      config,
      null,
      [],
      [mapImportsToPathAliases(config, '', outputTarget)],
    );

    expect(module.outputText).toContain('import { utils } from "@utils";');
  });

  // The spy isolates our path-computation logic from TypeScript's module resolver.
  // Real resolution would require actual files on disk and is TypeScript's concern, not Stencil's.
  it('replaces the path alias with the generated relative path', () => {
    resolveModuleNameSpy.mockReturnValue({
      resolvedModule: {
        isExternalLibraryImport: false,
        extension: '.ts',
        resolvedFileName: 'utils.ts',
      },
    });
    const inputText = `
        import { utils } from "@utils";

        utils.test();
    `;

    module = transpileModule(
      inputText,
      config,
      null,
      [],
      [mapImportsToPathAliases(config, '', outputTarget)],
    );

    expect(module.outputText).toContain('import { utils } from "./utils";');
  });

  it('is not greedy with extension regex replacement', () => {
    resolveModuleNameSpy.mockReturnValue({
      resolvedModule: {
        isExternalLibraryImport: false,
        extension: '.ts',
        resolvedFileName: 'utils/something-ending-with-d.ts',
      },
    });
    const inputText = `
        import { utils } from "@utils/something-ending-with-d";

        utils.test();
    `;

    module = transpileModule(
      inputText,
      config,
      null,
      [],
      [mapImportsToPathAliases(config, '', outputTarget)],
    );

    expect(module.outputText).toContain('import { utils } from "./utils/something-ending-with-d";');
  });

  // The resolved module is not part of the output directory
  it('generates the correct relative path when the resolved module is outside the transpiled project', () => {
    config.srcDir = '/test-dir';
    resolveModuleNameSpy.mockReturnValue({
      resolvedModule: {
        isExternalLibraryImport: false,
        extension: '.ts',
        resolvedFileName: '/some-compiled-dir/utils/utils.ts',
      },
    });
    const inputText = `
        import { utils } from "@utils";

        utils.test();
    `;

    module = transpileModule(
      inputText,
      config,
      null,
      [],
      [mapImportsToPathAliases(config, '/dist/collection/test.js', outputTarget)],
    );

    expect(module.outputText).toContain(
      `import { utils } from "../../some-compiled-dir/utils/utils";`,
    );
  });

  // Source module and resolved module are in the same output directory
  it('generates the correct relative path when the resolved module is within the transpiled project', () => {
    config.srcDir = '/test-dir';
    resolveModuleNameSpy.mockReturnValue({
      resolvedModule: {
        isExternalLibraryImport: false,
        extension: '.ts',
        resolvedFileName: '/test-dir/utils/utils.ts',
      },
    });
    const inputText = `
        import { utils } from "@utils";

        utils.test();
    `;

    module = transpileModule(
      inputText,
      config,
      null,
      [],
      [mapImportsToPathAliases(config, 'dist/collection/test.js', outputTarget)],
    );

    expect(module.outputText).toContain(`import { utils } from "./utils/utils";`);
  });
});
