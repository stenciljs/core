/* eslint-disable jest/no-test-prefixes, jest/no-commented-out-tests, jest/expect-expect -- this file needs to be brought up to date at some point */
// TODO(STENCIL-487): Investigate reviving this test file
import { createCompiler } from '@stencil/core/compiler';
import type * as d from '@stencil/core/declarations';
import { mockCompilerSystem, mockLoadConfigInit } from '@stencil/core/testing';
import path from 'path';

import { validateConfig } from '../../config/validate-config';

xdescribe('component-styles', () => {
  jest.setTimeout(20000);
  let compiler: d.Compiler;
  const root = path.resolve('/');

  beforeEach(async () => {
    const sys: d.CompilerSystem = mockCompilerSystem() as any;
    await sys.writeFile(
      '/tsconfig.json',
      `
      {
        "compilerOptions": {
          "experimentalDecorators": true,
          "jsx": "react",
          "jsxFactory": "h",
          "lib": [
            "dom",
            "es2019",
            "esnext.array"
          ],
          "module": "esnext",
          "moduleResolution": "node",
          "target": "es2017"
        }
      }
    `,
    );

    const { config } = validateConfig(
      {
        rootDir: '/',
        tsconfig: '/tsconfig.json',
      },
      mockLoadConfigInit(),
    );
    config.sys = sys;
    compiler = await createCompiler(config);

    // const testingConfig = mockConfig(sys);
    // testingConfig.rootDir = '/';
    // testingConfig.cwd = '/';
    // await sys.writeFile(
    //   '/stencil.config.json',
    //   `
    //   {
    //     "compilerOptions": {
    //       "experimentalDecorators": true,
    //       "jsx": "react",
    //       "jsxFactory": "h",
    //       "lib": [
    //         "dom",
    //         "es2018",
    //         "esnext.array"
    //       ],
    //       "module": "esnext",
    //       "moduleResolution": "node",
    //       "target": "es2017",
    //     }
    //   }
    // `,
    // );
    // console.log(sys.readdirSync('/'));
    // const results = await loadConfig({
    //   config: testingConfig,
    //   sys,
    //   logger,
    //   configPath: '',
    //   typescriptPath: '/tsconfig.json',
    // });

    // const config = results.config;

    // compiler = await createCompiler(config);
    await compiler.sys.writeFile(path.join(root, 'src', 'index.html'), `<cmp-a></cmp-a>`);
  });

  it('should build one component w/ out inline style, and re-compile when adding inline styles', async () => {
    await compiler.sys.writeFile(
      path.join(root, 'src', 'cmp-a.tsx'),
      `@Component({ tag: 'cmp-a' }) export class CmpA {}`,
    );
    const watcher = await compiler.createWatcher();
    // compiler.config.watch = true;
    await watcher.start();
    // let r = await compiler.build();
    // expect(r.diagnostics).toHaveLength(0);
    // expect(r.styleBuildCount).toBe(0);
    // const rebuildListener = compiler.once('buildFinish');
    // await compiler.fs.writeFiles(
    //   {
    //     [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styles: 'body { color: green; }' }) export class CmpA {}`,
    //   },
    //   { clearFileCache: true },
    // );
    // await compiler.fs.commit();
    // compiler.trigger('fileUpdate', path.join(root, 'src', 'cmp-a.tsx'));
    // r = await rebuildListener;
    // expect(r.diagnostics).toHaveLength(0);
    // expect(r.hmr.inlineStylesUpdated).toHaveLength(1);
    // expect(r.hmr.inlineStylesUpdated[0].styleText).toBe(`body { color: green; }`);
    // const content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
    // expect(content).toContain(`color: green`);
    // expect(r.styleBuildCount).toBe(1);
  });

  // it('should build one component w/ inline style, and re-compile when removing inline styles', async () => {
  //   compiler.config.watch = true;
  //   await compiler.fs.writeFiles({
  //     [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styles: 'body { color: green; }' }) export class CmpA {}`,
  //   });
  //   await compiler.fs.commit();

  //   let r = await compiler.build();
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.styleBuildCount).toBe(1);

  //   const rebuildListener = compiler.once('buildFinish');

  //   await compiler.fs.writeFiles(
  //     {
  //       [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a' }) export class CmpA {}`,
  //     },
  //     { clearFileCache: true },
  //   );
  //   await compiler.fs.commit();

  //   compiler.trigger('fileUpdate', path.join(root, 'src', 'cmp-a.tsx'));

  //   r = await rebuildListener;
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.hmr.inlineStylesUpdated).toHaveLength(1);
  //   expect(r.hmr.inlineStylesUpdated[0].styleText).toBe(``);

  //   const content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).not.toContain(`color: green`);
  //   expect(r.styleBuildCount).toBe(0);
  // });

  // it('should build one component w/ inline style, and re-compile on module file changes', async () => {
  //   compiler.config.watch = true;
  //   await compiler.fs.writeFiles({
  //     [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styles: 'body { color: red; }' }) export class CmpA {}`,
  //   });
  //   await compiler.fs.commit();

  //   let r = await compiler.build();
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.styleBuildCount).toBe(1);

  //   let content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain('color: red');

  //   const rebuildListener = compiler.once('buildFinish');

  //   await compiler.fs.writeFiles(
  //     {
  //       [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styles: 'body { color: green; }' }) export class CmpA {}`,
  //     },
  //     { clearFileCache: true },
  //   );
  //   await compiler.fs.commit();

  //   compiler.trigger('fileUpdate', path.join(root, 'src', 'cmp-a.tsx'));

  //   r = await rebuildListener;
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.hmr.inlineStylesUpdated).toHaveLength(1);
  //   expect(r.hmr.inlineStylesUpdated[0].styleText).toContain(`color: green`);

  //   content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain(`color: green`);
  //   expect(r.styleBuildCount).toBe(1);
  // });

  // it('should minify styleUrl', async () => {
  //   compiler.config.watch = true;
  //   compiler.config.minifyCss = true;
  //   await compiler.fs.writeFiles({
  //     [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css' }) export class CmpA {}`,
  //     [path.join(root, 'src', 'cmp-a.css')]: `body {    color:        red;    /** plz  minify me **/ }`,
  //   });
  //   await compiler.fs.commit();

  //   let r = await compiler.build();
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.styleBuildCount).toBe(1);

  //   let content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain(`body{color:red;}`);

  //   const rebuildListener = compiler.once('buildFinish');

  //   await compiler.fs.writeFiles(
  //     {
  //       [path.join(root, 'src', 'cmp-a.css')]: `body {    color:        green;    /** plz  minify me **/ }`,
  //     },
  //     { clearFileCache: true },
  //   );
  //   await compiler.fs.commit();

  //   compiler.trigger('fileUpdate', path.join(root, 'src', 'cmp-a.css'));

  //   r = await rebuildListener;
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.styleBuildCount).toBe(1);

  //   content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain(`color:green`);
  // });

  // it('should build one component w/ styleUrl, and re-compile css import of css import changes', async () => {
  //   compiler.config.watch = true;
  //   await compiler.fs.writeFiles({
  //     [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styleUrl: 'file-a.css', shadow: true }) export class CmpA {}`,
  //     [path.join(root, 'src', 'file-a.css')]: `@import "file-b.css"; div { color: red; }`,
  //     [path.join(root, 'src', 'file-b.css')]: `@import "file-c.css"; span { color: green; }`,
  //     [path.join(root, 'src', 'file-c.css')]: `p { color: blue; }`,
  //   });
  //   await compiler.fs.commit();

  //   let r = await compiler.build();
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.components).toHaveLength(1);
  //   expect(r.transpileBuildCount).toBe(1);
  //   expect(r.styleBuildCount).toBe(1);

  //   let content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain(`color: red`);
  //   expect(content).toContain(`color: green`);
  //   expect(content).toContain(`color: blue`);

  //   const rebuildListener = compiler.once('buildFinish');

  //   await compiler.fs.writeFiles(
  //     {
  //       [path.join(root, 'src', 'file-c.css')]: `p { color: yellow; }`,
  //     },
  //     { clearFileCache: true },
  //   );
  //   await compiler.fs.commit();

  //   compiler.trigger('fileUpdate', path.join(root, 'src', 'file-c.css'));

  //   r = await rebuildListener;
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.styleBuildCount).toBe(1);

  //   content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain(`color: red`);
  //   expect(content).toContain(`color: green`);
  //   expect(content).not.toContain(`color: blue`);
  //   expect(content).toContain(`color: yellow`);
  // });

  // it('should build one component w/ styleUrl, and not re-compile styles w/ no style changes', async () => {
  //   compiler.config.watch = true;
  //   await compiler.fs.writeFiles({
  //     [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css', shadow: true }) export class CmpA {}`,
  //     [path.join(root, 'src', 'cmp-a.css')]: `body { color: red; }`,
  //   });
  //   await compiler.fs.commit();

  //   let r = await compiler.build();
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.components).toHaveLength(1);
  //   expect(r.transpileBuildCount).toBe(1);
  //   expect(r.styleBuildCount).toBe(1);

  //   let content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain(`color: red`);

  //   const rebuildListener = compiler.once('buildFinish');

  //   await compiler.fs.writeFiles(
  //     {
  //       [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css' }) export class CmpA { constructor() { console.log('88'); } }`,
  //     },
  //     { clearFileCache: true },
  //   );
  //   await compiler.fs.commit();

  //   compiler.trigger('fileUpdate', path.join(root, 'src', 'cmp-a.tsx'));

  //   r = await rebuildListener;
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.styleBuildCount).toBe(0);

  //   content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain(`color: red`);
  //   expect(content).toContain(`console.log('88')`);
  // });

  // it('should build one component w/ styleUrl, and re-compile component decorator styles url changes', async () => {
  //   compiler.config.watch = true;
  //   await compiler.fs.writeFiles({
  //     [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styleUrl: 'cmp-a-red.css', shadow: true }) export class CmpA {}`,
  //     [path.join(root, 'src', 'cmp-a-red.css')]: `body { color: red; }`,
  //     [path.join(root, 'src', 'cmp-a-blue.css')]: `body { color: blue; }`,
  //   });
  //   await compiler.fs.commit();

  //   let r = await compiler.build();
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.components).toHaveLength(1);
  //   expect(r.transpileBuildCount).toBe(1);
  //   expect(r.styleBuildCount).toBe(1);

  //   let content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain(`color: red`);

  //   const rebuildListener = compiler.once('buildFinish');

  //   await compiler.fs.writeFiles(
  //     {
  //       [path.join(root, 'src', 'cmp-a.tsx')]: `@Component({ tag: 'cmp-a', styleUrl: 'cmp-a-blue.css' }) export class CmpA { constructor() { console.log('88'); } }`,
  //     },
  //     { clearFileCache: true },
  //   );
  //   await compiler.fs.commit();

  //   compiler.trigger('fileUpdate', path.join(root, 'src', 'cmp-a.tsx'));

  //   r = await rebuildListener;
  //   expect(r.diagnostics).toHaveLength(0);
  //   expect(r.styleBuildCount).toBe(1);

  //   content = await compiler.fs.readFile(path.join(root, 'www', 'build', 'cmp-a.entry.js'));
  //   expect(content).toContain(`color: blue`);
  //   expect(content).toContain(`console.log('88')`);
  // });
});
