import { createTestCompiler } from '@stencil/core/testing/compiler';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

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
});
