import { createTestCompiler } from '@stencil/core/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

import { expectFilesDoNotExist, expectFilesExist } from '../../../testing/testing-utils';
import { join } from '../../../utils';

describe('outputTarget, www', () => {
  let compiler: d.Compiler;
  // `createTestCompiler`'s default rootDir comes from the in-memory sys ('/'), which
  // may not match `path.resolve('/')` on Windows (drive-lettered) - read it back from
  // the actual validated config instead of assuming it up front. Use Stencil's own
  // `join` (always forward-slash) rather than native `path.join`, to match exactly
  // what the compiler itself uses internally when writing output.
  let root: string;

  beforeEach(async () => {
    const result = await createTestCompiler({ config: { outputTargets: [{ type: 'www' }] } });
    compiler = result.compiler;
    root = result.config.rootDir;
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('default www files', async () => {
    await compiler.fs.writeFiles({
      [join(root, 'src', 'index.html')]: `<cmp-a></cmp-a>`,
      [join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {}`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    expectFilesExist(compiler.fs, [
      join(root, 'www'),
      join(root, 'www', 'build'),
      join(root, 'www', 'build', 'cmp-a.entry.js'),
      join(root, 'www', 'index.html'),
      join(root, 'src', 'components.d.ts'),
    ]);

    expectFilesDoNotExist(compiler.fs, [join(root, 'src', 'cmp-a.js'), join(root, 'dist')]);
  });
});
