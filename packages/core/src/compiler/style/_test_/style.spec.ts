import { describe, it, beforeAll, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

import {
  createTestCompiler,
  prepareTestCompiler,
  type PreparedTestCompiler,
} from '../../../testing/compiler';
import { join } from '../../../utils';

describe('component-styles', () => {
  let setup: PreparedTestCompiler;
  let compiler: d.Compiler;
  // `createTestCompiler`'s default rootDir comes from the in-memory sys ('/'), which
  // may not match `path.resolve('/')` on Windows (drive-lettered) - read it back from
  // the actual validated config instead of assuming it up front. Use Stencil's own
  // `join` (always forward-slash) rather than native `path.join`, to match exactly
  // what the compiler itself uses internally when writing output.
  let root: string;

  beforeAll(async () => {
    setup = await prepareTestCompiler({
      config: {
        minifyCss: true,
        outputTargets: [{ type: 'www', hashFileNames: true }],
      },
    });
  });

  beforeEach(async () => {
    const result = await createTestCompiler({ setup });
    compiler = result.compiler;
    root = result.config.rootDir;
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('should add mode styles to hashed filename/minified builds', async () => {
    await compiler.fs.writeFile(join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.writeFiles({
      [join(root, 'src', 'cmp-a.tsx')]: `@Component({
        tag: 'cmp-a',
        styleUrls: {
          ios: 'cmp-a.ios.css',
          md: 'cmp-a.md.css'
        }
      })
      export class CmpA {}`,
      [join(root, 'src', 'cmp-a.ios.css')]: `body{font-family:Helvetica}`,
      [join(root, 'src', 'cmp-a.md.css')]: `body{font-family:Roboto}`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    let hasIos = false;
    let hasMd = false;

    r.outputs
      .flatMap((o) => o.files)
      .forEach((f) => {
        const content = compiler.fs.readFileSync(f);
        if (content.includes(`body{font-family:Helvetica}`)) hasIos = true;
        if (content.includes(`body{font-family:Roboto}`)) hasMd = true;
      });

    expect(hasIos).toBe(true);
    expect(hasMd).toBe(true);
  });

  it('should add default styles to hashed filename/minified builds', async () => {
    // @ts-expect-error - need to test custom hash function behavior
    compiler.config.sys.generateContentHash = function () {
      return 'hashed';
    };

    await compiler.fs.writeFile(join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.writeFiles({
      [join(root, 'src', 'cmp-a.tsx')]:
        `@Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css' }) export class CmpA {}`,
      [join(root, 'src', 'cmp-a.css')]: `body{color:red}`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const content = await compiler.fs.readFile(join(root, 'www', 'build', 'p-hashed.entry.js'));
    expect(content).toContain(`body{color:red}`);
  });
});
