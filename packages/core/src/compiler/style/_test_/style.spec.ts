import path from 'path';
import {
  createTestCompiler,
  prepareTestCompiler,
  type PreparedTestCompiler,
} from '@stencil/core/testing';
import { describe, it, beforeAll, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

describe('component-styles', () => {
  let setup: PreparedTestCompiler;
  let compiler: d.Compiler;
  const root = path.resolve('/');

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
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('should add mode styles to hashed filename/minified builds', async () => {
    await compiler.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({
        tag: 'cmp-a',
        styleUrls: {
          ios: 'cmp-a.ios.css',
          md: 'cmp-a.md.css'
        }
      })
      export class CmpA {}`,
      [path.join(root, 'src', 'cmp-a.ios.css')]: `body{font-family:Helvetica}`,
      [path.join(root, 'src', 'cmp-a.md.css')]: `body{font-family:Roboto}`,
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

    await compiler.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]:
        `@Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css' }) export class CmpA {}`,
      [path.join(root, 'src', 'cmp-a.css')]: `body{color:red}`,
    });
    await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const content = await compiler.fs.readFile(
      path.join(root, 'www', 'build', 'p-hashed.entry.js'),
    );
    expect(content).toContain(`body{color:red}`);
  });
});
