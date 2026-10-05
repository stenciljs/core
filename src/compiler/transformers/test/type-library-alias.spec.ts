import { mockCompilerSystem, mockConfig } from '@stencil/core/testing';
import { normalizePath } from '@utils';
import { join as pathJoin } from 'path';

import { createCompiler } from '../../compiler';
import { getTypeLibrary } from '../type-library';
import { transpileModule } from './transpile';

const join = (...segments: string[]): string => normalizePath(pathJoin(...segments), false);

describe('type library aliases', () => {
  it('keeps the declaration of a project type for an alias of that type', () => {
    const t = transpileModule(`
      export interface Box<T> { value: T }
      export type StringBox = Box<string>;

      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() box: StringBox;
      }
    `);

    expect(getTypeLibrary()[t.property.complexType.references.StringBox.id].declaration).toBe(
      'export interface Box<T> { value: T }',
    );
  });

  it('uses the alias declaration and docstring for an alias of a lib type', async () => {
    const sys = mockCompilerSystem();
    const rootDir = '/';
    const srcDir = join(rootDir, 'src');
    const config = mockConfig({
      buildDocs: true,
      sys,
      rootDir,
      srcDir,
      outputTargets: [{ type: 'docs-json', file: join(rootDir, 'docs.json') }],
    });
    const tsconfigPath = join(rootDir, 'tsconfig.json');

    await config.sys.createDir(srcDir, { recursive: true });
    await config.sys.writeFile(
      tsconfigPath,
      JSON.stringify({
        compilerOptions: { experimentalDecorators: true, module: 'esnext', moduleResolution: 'node', target: 'es2017' },
        include: ['src'],
      }),
    );
    await config.sys.writeFile(
      join('bin', 'lib.es2017.full.d.ts'),
      `
        /// <reference no-default-lib="true"/>
        interface Array<T> { length: number }
        interface Boolean {}
        interface Function {}
        interface IArguments {}
        interface Number {}
        interface Object {}
        interface RegExp {}
        interface String {}
      `,
    );
    await config.sys.writeFile(join('internal', 'stencil-public-docs.d.ts'), 'export interface JsonDocs {}');
    await config.sys.writeFile(
      join(srcDir, 'stencil-core.d.ts'),
      `
        declare module '@stencil/core' {
          export function Component(options: any): any;
          export function Prop(): any;
        }
      `,
    );
    await config.sys.writeFile(
      join(srcDir, 'names.ts'),
      `
        /** A list of names */
        export type Names = string[];
      `,
    );
    await config.sys.writeFile(
      join(srcDir, 'cmp-names.tsx'),
      `
        import { Component, Prop } from '@stencil/core';
        import { Names } from './names';

        @Component({ tag: 'cmp-names' })
        export class CmpNames {
          @Prop() names: Names;
        }
      `,
    );

    const originalCwd = process.cwd();
    const compiler = await createCompiler({ ...config, tsconfig: tsconfigPath });
    try {
      const results = await compiler.build();
      expect(results.diagnostics.filter((diagnostic) => diagnostic.level === 'error')).toEqual([]);

      const docsJson = JSON.parse(await compiler.sys.readFile(join(rootDir, 'docs.json')));
      const { id } = docsJson.components[0].props[0].complexType.references.Names;
      expect(docsJson.typeLibrary[id]).toMatchObject({
        declaration: 'export type Names = string[];',
        docstring: 'A list of names',
      });
    } finally {
      process.chdir(originalCwd);
      await compiler.destroy();
    }
  });
});
