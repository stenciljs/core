import path from 'path';
import {
  createTestCompiler,
  prepareTestCompiler,
  type PreparedTestCompiler,
} from '@stencil/core/testing';
import { describe, it, beforeAll, beforeEach, afterEach, expect } from 'vitest';
import type * as d from '@stencil/core';

import { normalizePath } from '../../../utils';

describe('plugin', () => {
  let setup: PreparedTestCompiler;
  let compiler: d.Compiler;
  const root = path.resolve('/');

  beforeAll(async () => {
    setup = await prepareTestCompiler();
  });

  beforeEach(async () => {
    const result = await createTestCompiler({ setup });
    compiler = result.compiler;
    await compiler.fs.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
    await compiler.fs.commit();
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('transform, async', async () => {
    await compiler.fs.writeFile(
      path.join(root, 'src', 'cmp-a.tsx'),
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

    const cmpA = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('transformed!');
  });

  it('transform, sync', async () => {
    await compiler.fs.writeFile(
      path.join(root, 'src', 'cmp-a.tsx'),
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

    const cmpA = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('transformed!');
  });

  it('resolveId, async', async () => {
    const filePath = normalizePath(path.join(root, 'dist', 'my-dep-fn.js'));

    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `
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

    const cmpA = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('imported depFun()');
  });

  it('resolveId, sync', async () => {
    const filePath = normalizePath(path.join(root, 'dist', 'my-dep-fn.js'));

    await compiler.fs.writeFiles({
      [path.join(root, 'src', 'cmp-a.tsx')]: `
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

    const cmpA = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('imported depFun()');
  });
});
