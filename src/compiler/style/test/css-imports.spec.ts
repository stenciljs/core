import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { buildError, normalizePath } from '@utils';
import path from 'path';

import { FsReadOptions } from '../../sys/in-memory-fs';
import {
  getCssImports,
  isCssNodeModule,
  isLocalCssImport,
  parseCssImports,
  replaceImportDeclarations,
} from '../css-imports';

describe('css-imports', () => {
  const root = path.resolve('/');
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;
  let config: d.ValidatedConfig;
  let readFileMock: jest.SpyInstance<Promise<string>, [string, FsReadOptions?]>;

  beforeEach(() => {
    config = mockValidatedConfig();
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
    readFileMock = jest.spyOn(compilerCtx.fs, 'readFile');
  });

  afterEach(() => {
    readFileMock.mockClear();
  });

  describe('isCssNodeModule', () => {
    it('starts with ~ is node module', () => {
      const url = `~@ionic/core/css/normalize.css`;
      expect(isCssNodeModule(url)).toBe(true);
    });

    it('contains ~', () => {
      const url = `ionic~a.css`;
      expect(isCssNodeModule(url)).toBe(false);
    });

    it('http url not node module', () => {
      const url = `http://stenciljs.com/styles.css`;
      expect(isCssNodeModule(url)).toBe(false);
    });

    it('local url not node module', () => {
      const url = `styles.css`;
      expect(isCssNodeModule(url)).toBe(false);
    });
  });

  describe('replaceImportDeclarations', () => {
    it('replace node_module imports w/ styleText', () => {
      const styleText = `@import '~@ionic/core/dist/ionic/ionic.css'; body { color: red; }`;
      const cssImports: d.CssImportData[] = [
        {
          filePath: `/node_modules/@ionic/core/dist/ionic/ionic.css`,
          srcImport: `@import '~@ionic/core/dist/ionic/ionic.css';`,
          url: `~@ionic/core/dist/ionic/ionic.css`,
          styleText: `div { color: blue; }`,
        },
      ];
      const output = replaceImportDeclarations(styleText, cssImports, true);
      expect(output).toBe(`div { color: blue; } body { color: red; }`);
    });

    it('replace local imports w/ styleText', () => {
      const styleText = `@import "file-a.css"; @import "./file-b.css"; body { color: red; }`;
      const cssImports: d.CssImportData[] = [
        {
          filePath: `/src/cmp/file-a.css`,
          srcImport: `@import "file-a.css";`,
          url: `file-a.css`,
          styleText: `div { color: blue; }`,
        },
        {
          filePath: `/src/cmp/file-b.css`,
          srcImport: `@import "./file-b.css";`,
          url: `./file-c.css`,
          styleText: `span { color: green; }`,
        },
      ];
      const output = replaceImportDeclarations(styleText, cssImports, true);
      expect(output).toBe(`div { color: blue; } span { color: green; } body { color: red; }`);
    });

    it('do nothing for no imports', () => {
      const styleText = `body { color: red; }`;
      const cssImports: d.CssImportData[] = [];
      const output = replaceImportDeclarations(styleText, cssImports, true);
      expect(output).toBe(`body { color: red; }`);
    });

    it('do nothing for empty string', () => {
      const styleText = ``;
      const cssImports: d.CssImportData[] = [];
      const output = replaceImportDeclarations(styleText, cssImports, true);
      expect(output).toBe(``);
    });
  });

  describe('isLocalCssImport', () => {
    it.each([
      {
        importStmt: '@import url(   "  https//stenciljs.com/some.css);',
        description: 'not local, http w/ spaces url',
        expected: false,
      },
      {
        importStmt: `@import url(//stenciljs.com/some.css);`,
        description: 'not local, // url',
        expected: false,
      },
      {
        importStmt: `@import url(https://stenciljs.com/some.css);`,
        description: 'not local, https url',
        expected: false,
      },
      {
        importStmt: `@import url(http://stenciljs.com/some.css);`,
        description: 'not local, http url, no quotes',
        expected: false,
      },
      {
        importStmt: `@import url("http://stenciljs.com/some.css");`,
        description: 'not local, http url, double quotes',
        expected: false,
      },
      {
        importStmt: `@import url('http://stenciljs.com/some.css');`,
        description: 'not local, http url, single quotes',
        expected: false,
      },
      {
        importStmt: `@import url('some.css');`,
        description: 'is local, url, single quotes',
        expected: true,
      },
      {
        importStmt: `@import url("some.css");`,
        description: 'is local, url, double quotes',
        expected: true,
      },
      {
        importStmt: `@import "some.css";`,
        description: 'is local, double quotes',
        expected: true,
      },
      {
        importStmt: `@import 'some.css';`,
        description: 'is local, single quotes',
        expected: true,
      },
    ])('should return $expected when $description', (testArgs) => {
      const { importStmt, expected } = testArgs;
      expect(isLocalCssImport(importStmt)).toBe(expected);
    });
  });

  describe('getCssImports', () => {
    it('scss extension', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.scss'));
      const content = `
        @import "file-b";
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'src', 'cmp', 'file-b.scss')),
          altFilePath: normalizePath(path.join(root, 'src', 'cmp', '_file-b.scss')),
          srcImport: `@import "file-b";`,
          url: `file-b`,
        },
      ]);
    });

    it('less extension', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.LESS'));
      const content = `
        @import "file-b";
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'src', 'cmp', 'file-b.less')),
          srcImport: `@import "file-b";`,
          url: `file-b`,
        },
      ]);
    });

    it('url() w/out quotes', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.scss'));
      const content = `
        @import url(../../node_modules/@ionic/core/css/normalize.css);
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'node_modules', '@ionic', 'core', 'css', 'normalize.css')),
          srcImport: `@import url(../../node_modules/@ionic/core/css/normalize.css);`,
          url: `../../node_modules/@ionic/core/css/normalize.css`,
        },
      ]);
    });

    it('absolute url()', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.scss'));
      const content = `
        @import url('${normalizePath(path.join(root, 'build', 'app', 'app.css'))}');
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'build', 'app', 'app.css')),
          srcImport: `@import url('${normalizePath(path.join(root, 'build', 'app', 'app.css'))}');`,
          url: `${normalizePath(path.join(root, 'build', 'app', 'app.css'))}`,
        },
      ]);
    });

    it('relative url()s', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.css'));
      const content = `
        @import url('file-a.css');@import  url('./file-b.css');
        @import url('../file-c.css');
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'src', 'cmp', 'file-a.css')),
          srcImport: `@import url('file-a.css');`,
          url: `file-a.css`,
        },
        {
          filePath: normalizePath(path.join(root, 'src', 'cmp', 'file-b.css')),
          srcImport: `@import  url('./file-b.css');`,
          url: `./file-b.css`,
        },
        {
          filePath: normalizePath(path.join(root, 'src', 'file-c.css')),
          srcImport: `@import url('../file-c.css');`,
          url: `../file-c.css`,
        },
      ]);
    });

    it('ignore imports inside comments', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.css'));
      const content = `
      @import url('file.css');
        /* @import url('file-a.css'); */
        /*@import  url('./file-b.css');
        @import url('../file-c.css');
        */
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'src', 'cmp', 'file.css')),
          srcImport: `@import url('file.css');`,
          url: `file.css`,
        },
      ]);
    });

    it('ignore external url()s', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.css'));
      const content = `
        @import url("http://stenciljs.com/build/app/app.css");
        @import url("HTTPS://stenciljs.com/build/app/app.css");
        @import url('//stenciljs.com/build/app/app.css');
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([]);
    });

    it('double quote, relative path @import', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.css'));
      const content = `
        @import "file-b.css";
        @import "./file-c.css";
        @import "../global/file-d.css";
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'src', 'cmp', 'file-b.css')),
          srcImport: `@import "file-b.css";`,
          url: `file-b.css`,
        },
        {
          filePath: normalizePath(path.join(root, 'src', 'cmp', 'file-c.css')),
          srcImport: `@import "./file-c.css";`,
          url: `./file-c.css`,
        },
        {
          filePath: normalizePath(path.join(root, 'src', 'global', 'file-d.css')),
          srcImport: `@import "../global/file-d.css";`,
          url: `../global/file-d.css`,
        },
      ]);
    });

    it('single quote, relative path @import', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.css'));
      const content = `
        @import 'file-b.css';
        @import './file-c.css';
        @import '../global/file-d.css';
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'src', 'cmp', 'file-b.css')),
          srcImport: `@import 'file-b.css';`,
          url: `file-b.css`,
        },
        {
          filePath: normalizePath(path.join(root, 'src', 'cmp', 'file-c.css')),
          srcImport: `@import './file-c.css';`,
          url: `./file-c.css`,
        },
        {
          filePath: normalizePath(path.join(root, 'src', 'global', 'file-d.css')),
          srcImport: `@import '../global/file-d.css';`,
          url: `../global/file-d.css`,
        },
      ]);
    });

    it('node path @import w/ package.json, no main field', async () => {
      const files = new Map<string, string>();
      const nodeModulePkgPath = path.join(root, 'node_modules', '@ionic', 'core', 'package.json');
      files.set(nodeModulePkgPath, JSON.stringify({ name: '@ionic/core' }));

      const nodeModuleMainPath = path.join(root, 'node_modules', '@ionic', 'core', 'index.js');
      files.set(nodeModuleMainPath, `// index.js`);

      const nodeModuleCss = path.join(root, 'node_modules', '@ionic', 'core', 'dist', 'ionic', 'ionic.css');
      files.set(nodeModuleCss, `/*ionic.css*/`);

      await compilerCtx.fs.writeFiles(files);
      await compilerCtx.fs.commit();

      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.css'));
      const content = `
        @import '~@ionic/core/dist/ionic/ionic.css';
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'node_modules', '@ionic', 'core', 'dist', 'ionic', 'ionic.css')),
          srcImport: `@import '~@ionic/core/dist/ionic/ionic.css';`,
          updatedImport: `@import "${normalizePath(
            path.join(root, 'node_modules', '@ionic', 'core', 'dist', 'ionic', 'ionic.css'),
          )}";`,
          url: `~@ionic/core/dist/ionic/ionic.css`,
        },
      ]);
    });

    it('node path @import w/ package.json, no path and main css field', async () => {
      const files = new Map<string, string>();
      const nodeModulePkgPath = path.join(root, 'node_modules', '@ionic', 'core', 'package.json');
      files.set(nodeModulePkgPath, JSON.stringify({ name: '@ionic/core', main: 'index.css' }));

      const nodeModuleMainPath = path.join(root, 'node_modules', '@ionic', 'core', 'index.css');
      files.set(nodeModuleMainPath, `/*ionic.css*/`);

      await compilerCtx.fs.writeFiles(files);
      await compilerCtx.fs.commit();

      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.css'));
      const content = `
        @import '~@ionic/core';
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'node_modules', '@ionic', 'core', 'index.css')),
          srcImport: `@import '~@ionic/core';`,
          updatedImport: `@import "${normalizePath(path.join(root, 'node_modules', '@ionic', 'core', 'index.css'))}";`,
          url: `~@ionic/core`,
        },
      ]);
    });

    it('node path @import w/ package.json and main JS field', async () => {
      const files = new Map<string, string>();
      const nodeModulePkgPath = path.join(root, 'node_modules', '@ionic', 'core', 'package.json');
      files.set(nodeModulePkgPath, JSON.stringify({ name: '@ionic/core', main: 'index.js' }));

      const nodeModuleMainPath = path.join(root, 'node_modules', '@ionic', 'core', 'index.js');
      files.set(nodeModuleMainPath, `// index.js`);

      const nodeModuleCss = path.join(root, 'node_modules', '@ionic', 'core', 'dist', 'ionic', 'ionic.css');
      files.set(nodeModuleCss, `/*ionic.css*/`);

      await compilerCtx.fs.writeFiles(files);
      await compilerCtx.fs.commit();

      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.css'));
      const content = `
        @import '~@ionic/core/dist/ionic/ionic.css';
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'node_modules', '@ionic', 'core', 'dist', 'ionic', 'ionic.css')),
          srcImport: `@import '~@ionic/core/dist/ionic/ionic.css';`,
          updatedImport: `@import "${normalizePath(
            path.join(root, 'node_modules', '@ionic', 'core', 'dist', 'ionic', 'ionic.css'),
          )}";`,
          url: `~@ionic/core/dist/ionic/ionic.css`,
        },
      ]);
    });

    it('absolute path @import', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'cmp', 'file-a.css'));
      const content = `
        @import '${normalizePath(path.join(root, 'src', 'file-b.css'))}';
      `;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([
        {
          filePath: normalizePath(path.join(root, 'src', 'file-b.css')),
          srcImport: `@import '${normalizePath(path.join(root, 'src', 'file-b.css'))}';`,
          url: `${normalizePath(path.join(root, 'src', 'file-b.css'))}`,
        },
      ]);
    });

    it('no @import', async () => {
      const filePath = normalizePath(path.join(root, 'src', 'file-a.css'));
      const content = `body { color: red; }`;
      const results = await getCssImports(config, compilerCtx, buildCtx, filePath, content);
      expect(results).toEqual([]);
    });
  });

  describe('parseCssImports', () => {
    it('should report an error when a CSS import is missing', async () => {
      const srcFilePath = normalizePath(path.join(root, 'src', 'file-a.css'));
      const resolvedFilePath = normalizePath(path.join(root, 'boop', 'file-a.css'));
      const content = '@import "missing"';

      await parseCssImports(config, compilerCtx, buildCtx, srcFilePath, resolvedFilePath, content, []);
      expect(buildCtx.diagnostics).toEqual([
        {
          ...buildError(),
          absFilePath: srcFilePath,
          messageText: 'Unable to read css import: @import "missing"',
        },
      ]);
    });

    it('should merge in imported files w/ child imports', async () => {
      const mainFilePath = normalizePath(path.join(root, 'src', 'main.css'));
      const firstImportPath = normalizePath(path.join(root, 'src', 'first.css'));
      const secondImportPath = normalizePath(path.join(root, 'src', 'second.css'));

      const files = {
        [mainFilePath]: '@import "first.css"',
        [firstImportPath]: '@import "second.css"; :host { color: red; }',
        [secondImportPath]: 'div { display: flex }',
      };

      readFileMock.mockImplementation(async (path: string) => {
        if (files[path]) {
          return files[path];
        } else {
          throw new Error('unmatched path!');
        }
      });

      const result = await parseCssImports(
        config,
        compilerCtx,
        buildCtx,
        mainFilePath,
        mainFilePath,
        files[mainFilePath],
        [],
      );
      // CSS from child and grandchild are merged in
      expect(result.styleText).toBe('div { display: flex } :host { color: red; }');
    });
  });
});
