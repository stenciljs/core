import path from 'path';
import { createTestCompiler } from '@stencil/core/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

import { expectFilesDoNotExist, expectFilesExist } from '../../../testing/testing-utils';

describe('outputTarget, www', () => {
  let compiler: d.Compiler;
  const root = path.resolve('/');

  beforeEach(async () => {
    const result = await createTestCompiler();
    compiler = result.compiler;
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('default www files', async () => {
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'index.html')]: `<cmp-a></cmp-a>`,
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {}`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    expectFilesExist(compiler.fs, [
      path.join(root, 'www'),
      path.join(root, 'www', 'build'),
      path.join(root, 'www', 'build', 'cmp-a.entry.js'),
      path.join(root, 'www', 'index.html'),
      path.join(root, 'src', 'components.d.ts'),
    ]);

    expectFilesDoNotExist(compiler.fs, [
      path.join(root, 'src', 'cmp-a.js'),
      path.join(root, 'dist'),
    ]);
  });
});
