import path from 'path';
import { createTestCompiler } from '@stencil/core/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

import { expectFilesDoNotExist, expectFilesExist } from '../../../testing/testing-utils';

describe('outputTarget, loader-bundle', () => {
  let compiler: d.Compiler;
  const root = path.resolve('/');

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
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('default loader-bundle files', async () => {
    await compiler.fs.writeFiles({
      [path.join(root, 'package.json')]: JSON.stringify({
        type: 'module',
        module: 'dist/loader-bundle/index.js',
      }),
      [path.join(root, 'src', 'index.html')]: `<cmp-a></cmp-a>`,
      [path.join(root, 'src', 'cmp-a.tsx')]: `
        @Component({
          tag: 'cmp-a',
          styleUrls: { ios: 'cmp-a.ios.css', md: 'cmp-a.md.css' }
        }) export class CmpA {}`,
      [path.join(root, 'src', 'cmp-a.ios.css')]: `cmp-a { color: blue; }`,
      [path.join(root, 'src', 'cmp-a.md.css')]: `cmp-a { color: green; }`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    expectFilesExist(compiler.fs, [
      // Browser/CDN lazy chunks (always generated)
      path.join(root, 'dist', 'loader-bundle'),
      // Distribution ESM and loader (generated because skipInDev: false)
      path.join(root, 'dist', 'loader-bundle', 'esm'),
      path.join(root, 'dist', 'loader-bundle', 'loader'),
      path.join(root, 'dist', 'loader-bundle', 'index.js'),
      // Source types
      path.join(root, 'src', 'components.d.ts'),
    ]);

    expectFilesDoNotExist(compiler.fs, [path.join(root, 'www'), path.join(root, 'build')]);
  });
});
