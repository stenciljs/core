import { execSync } from 'child_process';
import * as d from '@stencil/core';
import { beforeEach, describe, expect, it, vi, afterEach, Mock } from 'vitest';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { join } from '../../../utils';
import { stubComponentCompilerMeta } from '../../types/_tests_/ComponentCompilerMeta.stub';
import { writeExportMaps } from '../write-export-maps';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
  execFile: vi.fn(),
}));

describe('writeExportMaps', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;
  const execSyncMock = execSync as Mock;

  beforeEach(() => {
    config = mockValidatedConfig();
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not generate any exports if there are no output targets', () => {
    writeExportMaps(config, compilerCtx, buildCtx);

    expect(execSyncMock).toHaveBeenCalledTimes(0);
  });

  it('should generate the default exports for the lazy build if present, without a src/index.ts', () => {
    const loaderBundleTarget: d.OutputTargetLoaderBundle = {
      type: 'loader-bundle',
      dir: '/dist',
      buildDir: '/dist',
      copy: [],
      empty: true,
      cjs: true,
      skipInDev: false,
    };
    const typesTarget: d.OutputTargetTypes = {
      type: 'types',
      dir: '/dist/types',
      empty: true,
      skipInDev: true,
    };
    config.outputTargets = [loaderBundleTarget, typesTarget];

    writeExportMaps(config, compilerCtx, buildCtx);

    // 3 for root export + 3 for loader export
    expect(execSyncMock).toHaveBeenCalledTimes(6);
    // Without src/index.ts, dist/index.js is just an empty auto-generated stub -
    // the root export falls back to the loader script itself, same as "./loader"
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[.][import]"="./dist/esm/loader.js"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[.][require]"="./dist/cjs/loader.cjs"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[.][types]"="./dist/types/loader.d.ts"`,
    );
    // Loader export points directly to esm/loader.js
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[./loader][import]"="./dist/esm/loader.js"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[./loader][require]"="./dist/cjs/loader.cjs"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[./loader][types]"="./dist/types/loader.d.ts"`,
    );
  });

  it('should generate an index.js root export for the lazy build when src/index.ts exists', async () => {
    const loaderBundleTarget: d.OutputTargetLoaderBundle = {
      type: 'loader-bundle',
      dir: '/dist',
      buildDir: '/dist',
      copy: [],
      empty: true,
      cjs: true,
      skipInDev: false,
    };
    const typesTarget: d.OutputTargetTypes = {
      type: 'types',
      dir: '/dist/types',
      empty: true,
      skipInDev: true,
    };
    config.outputTargets = [loaderBundleTarget, typesTarget];
    await compilerCtx.fs.writeFile(
      join(config.srcDir, 'index.ts'),
      'export * from "./components";',
    );

    writeExportMaps(config, compilerCtx, buildCtx);

    expect(execSyncMock).toHaveBeenCalledWith(`npm pkg set "exports[.][import]"="./dist/index.js"`);
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[.][require]"="./dist/index.cjs"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[.][types]"="./dist/types/index.d.ts"`,
    );
  });

  it('should generate the default exports for the custom elements build if present', () => {
    const typesTarget: d.OutputTargetTypes = {
      type: 'types',
      dir: '/dist/types',
      empty: true,
      skipInDev: true,
    };
    config.outputTargets = [
      {
        type: 'standalone',
        dir: '/dist/components',
      },
      typesTarget,
    ];

    writeExportMaps(config, compilerCtx, buildCtx);

    expect(execSyncMock).toHaveBeenCalledTimes(2);
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[.][import]"="./dist/components/index.js"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[.][types]"="./dist/types/index.d.ts"`,
    );
  });

  it('should generate the custom elements exports if the output target is present', () => {
    config.rootDir = '/';
    config.outputTargets.push(
      {
        type: 'standalone',
        dir: '/dist/components',
      },
      {
        type: 'types',
        dir: '/dist/types',
        empty: true,
        skipInDev: true,
      },
    );

    buildCtx.components = [
      stubComponentCompilerMeta({
        tagName: 'my-component',
        componentClassName: 'MyComponent',
      }),
    ];

    writeExportMaps(config, compilerCtx, buildCtx);

    // 2 for root export (import + types) + 2 for component export
    expect(execSyncMock).toHaveBeenCalledTimes(4);
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[./my-component][import]"="./dist/components/my-component.js"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[./my-component][types]"="./dist/components/my-component.d.ts"`,
    );
  });

  it('should generate the custom elements exports for multiple components', () => {
    config.rootDir = '/';
    config.outputTargets.push(
      {
        type: 'standalone',
        dir: '/dist/components',
      },
      {
        type: 'types',
        dir: '/dist/types',
        empty: true,
        skipInDev: true,
      },
    );

    buildCtx.components = [
      stubComponentCompilerMeta({
        tagName: 'my-component',
        componentClassName: 'MyComponent',
      }),
      stubComponentCompilerMeta({
        tagName: 'my-other-component',
        componentClassName: 'MyOtherComponent',
      }),
    ];

    writeExportMaps(config, compilerCtx, buildCtx);

    // 2 for root export (import + types) + 4 for component exports (2 each)
    expect(execSyncMock).toHaveBeenCalledTimes(6);
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[./my-component][import]"="./dist/components/my-component.js"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[./my-component][types]"="./dist/components/my-component.d.ts"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[./my-other-component][import]"="./dist/components/my-other-component.js"`,
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      `npm pkg set "exports[./my-other-component][types]"="./dist/components/my-other-component.d.ts"`,
    );
  });

  it('warns once and stops shelling out if the npm CLI is unavailable', () => {
    execSyncMock.mockImplementation(() => {
      throw new Error('spawn npm ENOENT');
    });

    config.rootDir = '/';
    config.outputTargets.push(
      {
        type: 'standalone',
        dir: '/dist/components',
      },
      {
        type: 'types',
        dir: '/dist/types',
        empty: true,
        skipInDev: true,
      },
    );
    buildCtx.components = [
      stubComponentCompilerMeta({ tagName: 'my-component', componentClassName: 'MyComponent' }),
    ];

    writeExportMaps(config, compilerCtx, buildCtx);

    // only the first attempt (root export "import") should actually shell out;
    // every subsequent call short-circuits once npm is known to be unavailable
    expect(execSyncMock).toHaveBeenCalledTimes(1);
    expect(buildCtx.diagnostics).toHaveLength(1);
    expect(buildCtx.diagnostics[0].level).toBe('warn');
    expect(buildCtx.diagnostics[0].messageText).toContain('npm');
  });
});
