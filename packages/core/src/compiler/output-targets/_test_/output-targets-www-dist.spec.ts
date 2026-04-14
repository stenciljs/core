// @ts-nocheck
import path from 'path';
import { Compiler, Config } from '@stencil/core';
import { mockConfig } from '@stencil/core/testing';
import { expect, describe, it } from '@stencil/vitest';
import type * as d from '@stencil/core';

import { expectFilesDoNotExist, expectFilesExist } from '../../../testing/testing-utils';

describe.skip('outputTarget, www / dist / docs', () => {
  let compiler: Compiler;
  let config: Config;
  const root = path.resolve('/');

  it('dist, www and readme files w/ custom paths', async () => {
    config = mockConfig({
      buildAppCore: true,
      flags: { docs: true },
      namespace: 'TestApp',
      outputTargets: [
        {
          type: 'www',
          dir: 'custom-www',
          buildDir: 'www-build',
          indexHtml: 'custom-index.htm',
        } as any as d.OutputTargetLoaderBundle,
        {
          type: 'dist',
          dir: 'custom-dist',
          buildDir: 'dist-build',
          collectionDir: 'stencil-meta',
          typesDir: 'custom-types',
        },
        {
          type: 'docs',
        } as d.OutputTargetDocsReadme,
      ],
      rootDir: path.join(root, 'User', 'testing', '/'),
    });

    compiler = new Compiler(config);

    await compiler.fs.writeFiles({
      [path.join(root, 'User', 'testing', 'package.json')]: `{
        "module": "custom-dist/index.mjs",
        "main": "custom-dist/index.js",
        "collection": "custom-dist/stencil-meta/collection-manifest.json",
        "types": "custom-dist/custom-types/components.d.ts"
      }`,
      [path.join(root, 'User', 'testing', 'src', 'index.html')]: `<cmp-a></cmp-a>`,
      [path.join(root, 'User', 'testing', 'src', 'components', 'cmp-a.tsx')]:
        `@Component({ tag: 'cmp-a' }) export class CmpA {}`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    expectFilesExist(compiler.fs, [path.join(root, 'User', 'testing', 'custom-dist', 'cjs')]);

    expectFilesDoNotExist(compiler.fs, [
      path.join(root, 'User', 'testing', 'www', '/'),
      path.join(root, 'User', 'testing', 'www', 'index.html'),
      path.join(root, 'User', 'testing', 'www', 'custom-index.htm'),
      path.join(root, 'User', 'testing', 'custom-www', 'index.html'),
    ]);
  });
});
