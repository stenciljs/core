// @ts-nocheck
import { createCompiler } from '@stencil/core/compiler';
import { mockConfig } from '@stencil/core/testing';
import { normalizePath } from '@utils';
import path from 'path';

import type * as d from '../../../declarations';

describe.skip('plugin', () => {
  jest.setTimeout(20000);
  let compiler: d.Compiler;
  let config: d.Config;
  const root = path.resolve('/');

  beforeEach(async () => {
    config = mockConfig();
    compiler = await createCompiler(config);
    console.log(compiler.sys);
    await compiler.sys.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
  });

  afterEach(async () => {
    await compiler.destroy();
  });

  it('transform, async', async () => {
    compiler.config.bundles = [{ components: ['cmp-a'] }];

    await compiler.fs.writeFiles(
      {
        [path.join(root, 'stencil.config.js')]: `

        exports.config = {
          plugins: [myPlugin()]
        };
      `,
        [path.join(root, 'src', 'cmp-a.tsx')]: `
        @Component({ tag: 'cmp-a' }) export class CmpA {
          constructor() { }
        }
      `,
      },
      { clearFileCache: true },
    );
    await compiler.fs.commit();

    function myPlugin() {
      return {
        transform: function (sourceText: string) {
          return new Promise((resolve) => {
            sourceText += `\nconsole.log('transformed!')`;
            resolve(sourceText);
          });
        },
        name: 'myPlugin',
      };
    }

    config.rollupPlugins = [myPlugin()];

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const cmpA = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('transformed!');
  });

  it('transform, sync', async () => {
    await compiler.fs.writeFiles(
      {
        [path.join(root, 'src', 'cmp-a.tsx')]: `
        @Component({ tag: 'cmp-a' }) export class CmpA {
          constructor() { }
        }
      `,
      },
      { clearFileCache: true },
    );
    await compiler.fs.commit();

    function myPlugin() {
      return {
        transform(sourceText: string) {
          sourceText += `\nconsole.log('transformed!')`;
          return sourceText;
        },
        name: 'myPlugin',
      };
    }

    config.rollupPlugins = [myPlugin()];

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const cmpA = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('transformed!');
  });

  it('resolveId, async', async () => {
    const filePath = normalizePath(path.join(root, 'dist', 'my-dep-fn.js'));

    await compiler.fs.writeFiles(
      {
        [path.join(root, 'src', 'cmp-a.tsx')]: `
        import { depFn } '#crazy-path!'
        @Component({ tag: 'cmp-a' }) export class CmpA {
          constructor() {
            depFn();
          }
        }
      `,
        [filePath]: `
        export function depFn(){
          console.log('imported depFun()');
        }
      `,
      },
      { clearFileCache: true },
    );
    await compiler.fs.commit();

    function myPlugin() {
      return {
        resolveId(importee: string) {
          if (importee === '#crazy-path!') {
            return Promise.resolve(filePath);
          }
          return Promise.resolve(null);
        },
        name: 'myPlugin',
      };
    }

    config.rollupPlugins = [myPlugin()];

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const cmpA = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('imported depFun()');
  });

  it('resolveId, sync', async () => {
    const filePath = normalizePath(path.join(root, 'dist', 'my-dep-fn.js'));

    await compiler.fs.writeFiles(
      {
        [path.join(root, 'src', 'cmp-a.tsx')]: `
        import { depFn } '#crazy-path!'
        @Component({ tag: 'cmp-a' }) export class CmpA {
          constructor() {
            depFn();
          }
        }
      `,
        [filePath]: `
        export function depFn(){
          console.log('imported depFun()');
        }
      `,
      },
      { clearFileCache: true },
    );
    await compiler.fs.commit();

    function myPlugin() {
      return {
        resolveId(importee: string) {
          if (importee === '#crazy-path!') {
            return filePath;
          }
          return null;
        },
        name: 'myPlugin',
      };
    }
    config.rollupPlugins = [myPlugin()];

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    const cmpA = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
    expect(cmpA).toContain('imported depFun()');
  });
});
