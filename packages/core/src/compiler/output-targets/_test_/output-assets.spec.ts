import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import type * as d from '@stencil/core';

import {
  mockBuildCtx,
  mockCompilerCtx,
  mockCompilerSystem,
  mockComponentMeta,
  mockValidatedConfig,
} from '../../../testing';
import { ASSETS, WWW, join } from '../../../utils';
import { outputAssets } from '../output-assets';

describe('outputAssets', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;
  let sysCopySpy: ReturnType<
    typeof vi.fn<(copyTasks: Required<d.CopyTask>[], srcDir: string) => Promise<d.CopyResults>>
  >;

  beforeEach(() => {
    const sys = mockCompilerSystem();
    config = mockValidatedConfig({
      fsNamespace: 'test-app',
      namespace: 'TestApp',
      srcDir: '/src',
      sys,
    });
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);

    // Mock sys.copy
    sysCopySpy = vi
      .fn<(copyTasks: Required<d.CopyTask>[], srcDir: string) => Promise<d.CopyResults>>()
      .mockResolvedValue({
        diagnostics: [],
        dirPaths: [],
        filePaths: ['/dist/assets/my-component/icon.svg'],
      });
    config.sys.copy = sysCopySpy;

    vi.spyOn(compilerCtx.fs, 'cancelDeleteDirectoriesFromDisk');
    vi.spyOn(compilerCtx.fs, 'cancelDeleteFilesFromDisk');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('early returns', () => {
    it('should return early if no assets output targets', async () => {
      config.outputTargets = [];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).not.toHaveBeenCalled();
    });

    it('should return early if no components have assetsDirs', async () => {
      config.outputTargets = [{ type: ASSETS, dir: '/dist/assets', skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({ assetsDirs: [] }),
        mockComponentMeta({ assetsDirs: undefined as any }),
      ];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).not.toHaveBeenCalled();
    });

    it('should return early on rebuild if assets have not changed', async () => {
      config.outputTargets = [{ type: ASSETS, dir: '/dist/assets', skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];
      buildCtx.isRebuild = true;
      buildCtx.filesChanged = ['/src/components/other-file.ts']; // Not an asset file
      compilerCtx.hasSuccessfulBuild = true;
      buildCtx.entryModules = [
        {
          cmps: buildCtx.components,
          entryKey: 'test',
        },
      ];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).not.toHaveBeenCalled();
    });
  });

  describe('basic asset copying', () => {
    it('should copy component assets to the assets output directory', async () => {
      const assetsDir = '/dist/assets';
      config.outputTargets = [{ type: ASSETS, dir: assetsDir, skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).toHaveBeenCalledTimes(1);
      const copyTasks = sysCopySpy.mock.calls[0][0] as d.CopyTask[];
      expect(copyTasks).toHaveLength(1);
      expect(copyTasks[0]).toEqual({
        src: '/src/components/my-cmp/assets',
        dest: join(assetsDir, 'my-cmp'),
        warn: false,
        ignore: undefined,
        keepDirStructure: false,
      });
    });

    it('should handle multiple components with assets', async () => {
      const assetsDir = '/dist/assets';
      config.outputTargets = [{ type: ASSETS, dir: assetsDir, skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [{ absolutePath: '/src/components/cmp-a/icons', cmpRelativePath: 'cmp-a' }],
        }),
        mockComponentMeta({
          assetsDirs: [{ absolutePath: '/src/components/cmp-b/images', cmpRelativePath: 'cmp-b' }],
        }),
      ];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).toHaveBeenCalledTimes(1);
      const copyTasks = sysCopySpy.mock.calls[0][0] as d.CopyTask[];
      expect(copyTasks).toHaveLength(2);
      expect(copyTasks[0].src).toBe('/src/components/cmp-a/icons');
      expect(copyTasks[0].dest).toBe(join(assetsDir, 'cmp-a'));
      expect(copyTasks[1].src).toBe('/src/components/cmp-b/images');
      expect(copyTasks[1].dest).toBe(join(assetsDir, 'cmp-b'));
    });

    it('should handle components with multiple assetsDirs', async () => {
      const assetsDir = '/dist/assets';
      config.outputTargets = [{ type: ASSETS, dir: assetsDir, skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/icons', cmpRelativePath: 'my-cmp/icons' },
            { absolutePath: '/src/components/my-cmp/images', cmpRelativePath: 'my-cmp/images' },
          ],
        }),
      ];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).toHaveBeenCalledTimes(1);
      const copyTasks = sysCopySpy.mock.calls[0][0] as d.CopyTask[];
      expect(copyTasks).toHaveLength(2);
    });
  });

  describe('www output target integration', () => {
    it('should copy assets to www build directories', async () => {
      const assetsDir = '/dist/assets';
      const wwwBuildDir = '/www/build';
      config.outputTargets = [
        { type: ASSETS, dir: assetsDir, skipInDev: false },
        {
          type: WWW,
          dir: '/www',
          buildDir: wwwBuildDir,
          appDir: '/www',
          indexHtml: '/www/index.html',
          empty: true,
          copy: [],
          prerenderConfig: null,
        } as d.OutputTargetWww,
      ];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).toHaveBeenCalledTimes(1);
      const copyTasks = sysCopySpy.mock.calls[0][0] as d.CopyTask[];

      // Should have tasks for both assets dir and www assets dir
      expect(copyTasks).toHaveLength(2);
      expect(copyTasks.some((t) => t.dest === join(assetsDir, 'my-cmp'))).toBe(true);
      expect(copyTasks.some((t) => t.dest === join(wwwBuildDir, 'assets', 'my-cmp'))).toBe(true);
    });

    it('should copy to multiple www targets', async () => {
      const assetsDir = '/dist/assets';
      config.outputTargets = [
        { type: ASSETS, dir: assetsDir, skipInDev: false },
        {
          type: WWW,
          dir: '/www1',
          buildDir: '/www1/build',
          appDir: '/www1',
          indexHtml: '/www1/index.html',
          empty: true,
          copy: [],
          prerenderConfig: null,
        } as d.OutputTargetWww,
        {
          type: WWW,
          dir: '/www2',
          buildDir: '/www2/build',
          appDir: '/www2',
          indexHtml: '/www2/index.html',
          empty: true,
          copy: [],
          prerenderConfig: null,
        } as d.OutputTargetWww,
      ];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).toHaveBeenCalledTimes(1);
      const copyTasks = sysCopySpy.mock.calls[0][0] as d.CopyTask[];

      // 1 for assets dir + 2 for www targets = 3 total
      expect(copyTasks).toHaveLength(3);
      expect(copyTasks.some((t) => t.dest === join(assetsDir, 'my-cmp'))).toBe(true);
      expect(copyTasks.some((t) => t.dest === join('/www1/build', 'assets', 'my-cmp'))).toBe(true);
      expect(copyTasks.some((t) => t.dest === join('/www2/build', 'assets', 'my-cmp'))).toBe(true);
    });
  });

  describe('multiple assets targets', () => {
    it('should copy to multiple assets output directories', async () => {
      config.outputTargets = [
        { type: ASSETS, dir: '/dist/assets1', skipInDev: false },
        { type: ASSETS, dir: '/dist/assets2', skipInDev: false },
      ];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).toHaveBeenCalledTimes(1);
      const copyTasks = sysCopySpy.mock.calls[0][0] as d.CopyTask[];

      expect(copyTasks).toHaveLength(2);
      expect(copyTasks.some((t) => t.dest === join('/dist/assets1', 'my-cmp'))).toBe(true);
      expect(copyTasks.some((t) => t.dest === join('/dist/assets2', 'my-cmp'))).toBe(true);
    });
  });

  describe('rebuild behavior', () => {
    it('should copy assets when asset files have changed', async () => {
      config.outputTargets = [{ type: ASSETS, dir: '/dist/assets', skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];
      buildCtx.isRebuild = true;
      buildCtx.filesChanged = ['/src/components/my-cmp/assets/icon.svg']; // Asset file changed
      compilerCtx.hasSuccessfulBuild = true;
      buildCtx.entryModules = [
        {
          cmps: buildCtx.components,
          entryKey: 'test',
        },
      ];

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).toHaveBeenCalled();
    });

    it('should always copy assets on first build', async () => {
      config.outputTargets = [{ type: ASSETS, dir: '/dist/assets', skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];
      buildCtx.isRebuild = false;
      compilerCtx.hasSuccessfulBuild = false;

      await outputAssets(config, compilerCtx, buildCtx);

      expect(sysCopySpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle copy errors gracefully', async () => {
      config.outputTargets = [{ type: ASSETS, dir: '/dist/assets', skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];

      const error = new Error('Copy failed');
      sysCopySpy.mockRejectedValue(error);

      await outputAssets(config, compilerCtx, buildCtx);

      // Should add error to diagnostics
      expect(buildCtx.diagnostics).toHaveLength(1);
      expect(buildCtx.diagnostics[0].messageText).toBe('Copy failed');
    });

    it('should handle copy returning diagnostics', async () => {
      config.outputTargets = [{ type: ASSETS, dir: '/dist/assets', skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];

      const diagnostic: d.Diagnostic = {
        level: 'warn',
        type: 'build',
        messageText: 'File not found',
        lines: [],
      };
      sysCopySpy.mockResolvedValue({
        diagnostics: [diagnostic],
        dirPaths: [],
        filePaths: [],
      });

      await outputAssets(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics).toContain(diagnostic);
    });
  });

  describe('cancel delete behavior', () => {
    it('should cancel deletion of copied files and directories', async () => {
      config.outputTargets = [{ type: ASSETS, dir: '/dist/assets', skipInDev: false }];
      buildCtx.components = [
        mockComponentMeta({
          assetsDirs: [
            { absolutePath: '/src/components/my-cmp/assets', cmpRelativePath: 'my-cmp' },
          ],
        }),
      ];

      const copyResult = {
        diagnostics: [],
        dirPaths: ['/dist/assets/my-cmp'],
        filePaths: ['/dist/assets/my-cmp/icon.svg'],
      };
      sysCopySpy.mockResolvedValue(copyResult);

      await outputAssets(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.cancelDeleteDirectoriesFromDisk).toHaveBeenCalledWith(
        copyResult.dirPaths,
      );
      expect(compilerCtx.fs.cancelDeleteFilesFromDisk).toHaveBeenCalledWith(copyResult.filePaths);
    });
  });

  describe('no assets scenario', () => {
    it('should handle scenario with no copy tasks gracefully', async () => {
      config.outputTargets = [{ type: ASSETS, dir: '/dist/assets', skipInDev: false }];
      // Components exist but none have assetsDirs with actual content
      buildCtx.components = [mockComponentMeta({ assetsDirs: [] })];

      await outputAssets(config, compilerCtx, buildCtx);

      // Should return early without calling copy
      expect(sysCopySpy).not.toHaveBeenCalled();
    });
  });
});
