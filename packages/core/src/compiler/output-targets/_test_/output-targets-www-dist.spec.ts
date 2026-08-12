import path from 'path';
import { createTestCompiler } from '@stencil/core/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

import { expectFilesDoNotExist, expectFilesExist } from '../../../testing/testing-utils';

describe('outputTarget, www / loader-bundle', () => {
  let compiler: d.Compiler;
  // `createTestCompiler`'s default rootDir comes from the in-memory sys ('/'), which
  // may not match `path.resolve('/')` on Windows (drive-lettered) - read it back from
  // the actual validated config instead of assuming it up front. Output target `dir`s
  // below are relative (resolved against rootDir by config validation) for the same reason.
  let root: string;

  beforeEach(async () => {
    const result = await createTestCompiler({
      config: {
        outputTargets: [
          {
            type: 'www',
            dir: 'custom-www',
            indexHtml: 'custom-index.htm',
          } as d.OutputTargetWww,
          {
            type: 'loader-bundle',
            dir: 'custom-dist',
            cjs: true,
            skipInDev: false,
          } as d.OutputTargetLoaderBundle,
          { type: 'docs-readme' } as d.OutputTargetDocsReadme,
        ],
      },
    });
    compiler = result.compiler;
    root = result.config.rootDir;
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('www and loader-bundle with custom paths', async () => {
    await compiler.fs.writeFiles({
      [path.join(root, 'package.json')]: JSON.stringify({
        type: 'module',
        module: 'custom-dist/index.js',
        main: 'custom-dist/index.cjs',
      }),
      [path.join(root, 'src', 'index.html')]: `<cmp-a></cmp-a>`,
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {}`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    // custom-dist should have loader-bundle distribution outputs
    expectFilesExist(compiler.fs, [
      path.join(root, 'custom-dist'),
      path.join(root, 'custom-dist', 'esm'),
      path.join(root, 'custom-dist', 'cjs'),
    ]);

    // default www/ must not exist - only custom-www/ should
    expectFilesDoNotExist(compiler.fs, [
      path.join(root, 'www'),
      // custom-www with default index.html must not exist (custom indexHtml is custom-index.htm)
      path.join(root, 'custom-www', 'index.html'),
    ]);
  });
});
