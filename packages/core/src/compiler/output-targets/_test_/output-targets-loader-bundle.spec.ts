import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

import { createTestCompiler } from '../../../testing/compiler';
import { expectFilesDoNotExist, expectFilesExist } from '../../../testing/testing-utils';
import { join } from '../../../utils';

describe('outputTarget, loader-bundle', () => {
  let compiler: d.Compiler;
  // `createTestCompiler`'s default rootDir comes from the in-memory sys ('/'), which
  // may not match `path.resolve('/')` on Windows (drive-lettered) - read it back from
  // the actual validated config instead of assuming it up front. Use Stencil's own
  // `join` (always forward-slash) rather than native `path.join`, to match exactly
  // what the compiler itself uses internally when writing output.
  let root: string;

  beforeEach(async () => {
    const result = await createTestCompiler({
      config: {
        outputTargets: [
          {
            type: 'loader-bundle',
            skipInDev: false,
          } as d.OutputTargetLoaderBundle,
        ],
      },
    });
    compiler = result.compiler;
    root = result.config.rootDir;
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('default loader-bundle files', async () => {
    await compiler.fs.writeFiles({
      [join(root, 'package.json')]: JSON.stringify({
        type: 'module',
        module: 'dist/loader-bundle/index.js',
      }),
      [join(root, 'src', 'index.html')]: `<cmp-a></cmp-a>`,
      [join(root, 'src', 'cmp-a.tsx')]: `
        @Component({
          tag: 'cmp-a',
          styleUrls: { ios: 'cmp-a.ios.css', md: 'cmp-a.md.css' }
        }) export class CmpA {}`,
      [join(root, 'src', 'cmp-a.ios.css')]: `cmp-a { color: blue; }`,
      [join(root, 'src', 'cmp-a.md.css')]: `cmp-a { color: green; }`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    expectFilesExist(compiler.fs, [
      // Browser/CDN lazy chunks (always generated)
      join(root, 'dist', 'loader-bundle'),
      // Distribution ESM and loader (generated because skipInDev: false)
      join(root, 'dist', 'loader-bundle', 'esm'),
      join(root, 'dist', 'loader-bundle', 'loader'),
      join(root, 'dist', 'loader-bundle', 'index.js'),
      // Source types
      join(root, 'src', 'components.d.ts'),
    ]);

    expectFilesDoNotExist(compiler.fs, [join(root, 'www'), join(root, 'build')]);
  });

  describe('loader.d.ts setAssetPath', () => {
    // The shared `compiler`/`root` from the outer `beforeEach` don't request a `types`
    // output target, so each test here builds its own compiler with one added.
    const buildWithTypesOutput = async (): Promise<{ compiler: d.Compiler; root: string }> => {
      const result = await createTestCompiler({
        config: {
          outputTargets: [
            { type: 'loader-bundle', skipInDev: false } as d.OutputTargetLoaderBundle,
            { type: 'types' } as d.OutputTargetTypes,
          ],
        },
      });
      return { compiler: result.compiler, root: result.config.rootDir };
    };

    it('is exported when a component declares assetsDirs, so a consuming bundler can override it', async () => {
      const { compiler: assetsCompiler, root: assetsRoot } = await buildWithTypesOutput();
      try {
        await assetsCompiler.fs.writeFiles({
          [join(assetsRoot, 'package.json')]: JSON.stringify({
            type: 'module',
            module: 'dist/loader-bundle/index.js',
          }),
          [join(assetsRoot, 'src', 'index.html')]: `<cmp-a></cmp-a>`,
          [join(assetsRoot, 'src', 'cmp-a.tsx')]: `
            @Component({
              tag: 'cmp-a',
              assetsDirs: ['assets'],
            }) export class CmpA {}`,
          [join(assetsRoot, 'src', 'assets', 'logo.svg')]: `<svg></svg>`,
        });
        await assetsCompiler.fs.commit();

        const r = await assetsCompiler.build();
        expect(r.diagnostics).toHaveLength(0);

        const loaderDts = await assetsCompiler.fs.readFile(
          join(assetsRoot, 'dist', 'types', 'loader.d.ts'),
        );
        expect(loaderDts).toContain('export declare function setAssetPath(path: string): string;');
      } finally {
        await assetsCompiler.destroy();
      }
    });

    it('is omitted when no component declares assets', async () => {
      const { compiler: noAssetsCompiler, root: noAssetsRoot } = await buildWithTypesOutput();
      try {
        await noAssetsCompiler.fs.writeFiles({
          [join(noAssetsRoot, 'package.json')]: JSON.stringify({
            type: 'module',
            module: 'dist/loader-bundle/index.js',
          }),
          [join(noAssetsRoot, 'src', 'index.html')]: `<cmp-a></cmp-a>`,
          [join(noAssetsRoot, 'src', 'cmp-a.tsx')]: `
            @Component({ tag: 'cmp-a' }) export class CmpA {}`,
        });
        await noAssetsCompiler.fs.commit();

        const r = await noAssetsCompiler.build();
        expect(r.diagnostics).toHaveLength(0);

        const loaderDts = await noAssetsCompiler.fs.readFile(
          join(noAssetsRoot, 'dist', 'types', 'loader.d.ts'),
        );
        expect(loaderDts).not.toContain('setAssetPath');
      } finally {
        await noAssetsCompiler.destroy();
      }
    });
  });
});
