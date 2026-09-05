import { describe, it, beforeAll, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

import {
  createTestCompiler,
  prepareTestCompiler,
  type PreparedTestCompiler,
} from '../../../testing/compiler';
import { join } from '../../../utils';

describe('plugin', () => {
  let setup: PreparedTestCompiler;
  let compiler: d.Compiler;
  // `createTestCompiler`'s default rootDir comes from the in-memory sys ('/'), which
  // may not match `path.resolve('/')` on Windows (drive-lettered) - read it back from
  // the actual validated config instead of assuming it up front. Use Stencil's own
  // `join` (always forward-slash) rather than native `path.join`, to match exactly
  // what the compiler itself uses internally when writing output.
  let root: string;

  beforeAll(async () => {
    setup = await prepareTestCompiler({ config: { outputTargets: [{ type: 'www' }] } });
  });

  beforeEach(async () => {
    const result = await createTestCompiler({ setup });
    compiler = result.compiler;
    root = result.config.rootDir;
    await compiler.fs.writeFile(join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.commit();
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('transform, async', async () => {
    await compiler.fs.writeFile(
      join(root, 'src', 'cmp-a.tsx'),
      `@Component({ tag: 'cmp-a' }) export class CmpA { constructor() { } }`,
    );
    await compiler.fs.commit();

    function myPlugin() {
      return {
        transform(sourceText: string) {
          return new Promise<string>((resolve) => {
            resolve(sourceText + `\nconsole.log('transformed!')`);
          });
        },
        name: 'myPlugin',
      };
    }

    compiler.config.rolldownPlugins = { before: [myPlugin()] };

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const cmpA = await compiler.fs.readFile(join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('transformed!');
  });

  it('transform, sync', async () => {
    await compiler.fs.writeFile(
      join(root, 'src', 'cmp-a.tsx'),
      `@Component({ tag: 'cmp-a' }) export class CmpA { constructor() { } }`,
    );
    await compiler.fs.commit();

    function myPlugin() {
      return {
        transform(sourceText: string) {
          return sourceText + `\nconsole.log('transformed!')`;
        },
        name: 'myPlugin',
      };
    }

    compiler.config.rolldownPlugins = { before: [myPlugin()] };

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const cmpA = await compiler.fs.readFile(join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('transformed!');
  });

  it('resolveId, async', async () => {
    const filePath = join(root, 'dist', 'my-dep-fn.js');

    await compiler.fs.writeFiles({
      [join(root, 'src', 'cmp-a.tsx')]: `
        import { depFn } from '#crazy-path!'
        @Component({ tag: 'cmp-a' }) export class CmpA {
          constructor() { depFn(); }
        }
      `,
      [filePath]: `export function depFn(){ console.log('imported depFun()'); }`,
    });
    await compiler.fs.commit();

    function myPlugin() {
      return {
        resolveId(importee: string) {
          if (importee === '#crazy-path!') return Promise.resolve(filePath);
          return Promise.resolve(null);
        },
        name: 'myPlugin',
      };
    }

    compiler.config.rolldownPlugins = { before: [myPlugin()] };

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const cmpA = await compiler.fs.readFile(join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('imported depFun()');
  });

  it('resolveId, sync', async () => {
    const filePath = join(root, 'dist', 'my-dep-fn.js');

    await compiler.fs.writeFiles({
      [join(root, 'src', 'cmp-a.tsx')]: `
        import { depFn } from '#crazy-path!'
        @Component({ tag: 'cmp-a' }) export class CmpA {
          constructor() { depFn(); }
        }
      `,
      [filePath]: `export function depFn(){ console.log('imported depFun()'); }`,
    });
    await compiler.fs.commit();

    function myPlugin() {
      return {
        resolveId(importee: string) {
          if (importee === '#crazy-path!') return filePath;
          return null;
        },
        name: 'myPlugin',
      };
    }

    compiler.config.rolldownPlugins = { before: [myPlugin()] };

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const cmpA = await compiler.fs.readFile(join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('imported depFun()');
  });
});
