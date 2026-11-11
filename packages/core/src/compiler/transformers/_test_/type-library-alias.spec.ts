import { createRequire } from 'module';
import { dirname, join as pathJoin } from 'path';
import { describe, expect, it } from 'vitest';

import { mockCompilerSystem, mockValidatedConfig } from '../../../testing';
import { normalizePath } from '../../../utils';
import { createCompiler } from '../../compiler';
import { validateTsConfig } from '../../sys/typescript/typescript-config';
import { getTypeLibrary } from '../type-library';
import { transpileModule } from './transpile';

const join = (...segments: string[]): string => normalizePath(pathJoin(...segments), false);

// `typescript-sys.ts` resolves TS's lib files via `require.resolve('typescript')`, so the mock fs
// stubs the lib file at that real path.
const typescriptLibDir = dirname(createRequire(import.meta.url).resolve('typescript'));

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
    const config = mockValidatedConfig({
      sys,
      rootDir,
      srcDir,
      outputTargets: [{ type: 'docs-json', file: join(rootDir, 'docs.json'), skipInDev: false }],
    });
    const tsconfigPath = join(rootDir, 'tsconfig.json');

    await config.sys.createDir(srcDir, { recursive: true });
    await config.sys.writeFile(
      tsconfigPath,
      JSON.stringify({
        compilerOptions: {
          experimentalDecorators: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          target: 'es2017',
        },
        include: ['src'],
      }),
    );
    await config.sys.writeFile(
      join(typescriptLibDir, 'lib.es2017.full.d.ts'),
      `
        /// <reference no-default-lib="true"/>
        interface Array<T> { length: number }
        interface Boolean {}
        interface CallableFunction {}
        interface Function {}
        interface IArguments {}
        interface Number {}
        interface NewableFunction {}
        interface Object {}
        interface RegExp {}
        interface String {}
      `,
    );
    await config.sys.writeFile(
      join('declarations', 'stencil-public-docs.d.ts'),
      'export interface JsonDocs {}',
    );
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
    const tsConfigResults = await validateTsConfig({ ...config, tsconfig: tsconfigPath }, sys);
    const compiler = await createCompiler({
      ...config,
      tsconfig: tsconfigPath,
      tsCompilerOptions: tsConfigResults.compilerOptions,
    });
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
