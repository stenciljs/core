import { createRequire } from 'module';
import { dirname, join as pathJoin, relative, resolve } from 'path';
import { mockCompilerSystem, mockValidatedConfig } from '@stencil/core/testing';
import { mockBuildCtx } from '@stencil/core/testing/compiler';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { normalizePath } from '../../../utils';
import { createCompiler } from '../../compiler';
import { validateTsConfig } from '../../sys/typescript/typescript-config';
import { convertDecoratorsToStatic } from '../decorators-to-static/convert-decorators';
import { getAttributeTypeInfo } from '../transform-utils';
import { getStaticGetter, transpileModule } from './transpile';
import { c, formatCode } from './utils';

const join = (...segments: string[]): string => normalizePath(pathJoin(...segments), false);

// `typescript-sys.ts` resolves TS's lib.*.d.ts files via `require.resolve('typescript')` so the
// mock in-memory fs used below must stub the lib file at that same real on-disk path.
const require = createRequire(import.meta.url);
const typescriptLibDir = dirname(require.resolve('typescript'));

describe('parse props', () => {
  it('prop optional', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val?: string;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'string | undefined',
          original: 'string',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: true,
        reflect: false,
        required: false,
        type: 'string',
        getter: false,
        setter: false,
      },
    });

    expect(t.property?.attribute).toBe('val');
    expect(t.property?.type).toBe('string');
    expect(t.property?.optional).toBe(true);
    expect(t.cmp?.hasProp).toBe(true);
  });

  it('should correctly parse a prop with an inferred enum type', () => {
    const t = transpileModule(`
    export enum Mode {
      DEFAULT = 'default'
    }
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: Mode;
      }
    `);

    // Using the `properties` array directly here since the `transpileModule`
    // method doesn't like the top-level enum export with the current `target` and
    // `module` values for the tsconfig
    expect(t.properties[0]).toEqual({
      name: 'val',
      type: 'string',
      attribute: 'val',
      reflect: false,
      mutable: false,
      required: false,
      optional: false,
      defaultValue: undefined,
      complexType: {
        original: 'Mode',
        resolved: 'Mode',
        references: {
          Mode: { location: 'local', path: 'module.tsx', id: 'module.tsx::Mode' },
        },
      },
      docs: { tags: [], text: '' },
      internal: false,
      getter: false,
      setter: false,
    });
  });

  it('tracks local enum and class references used by type queries', () => {
    const t = transpileModule(`
      export enum LocalEnum {
        Default = 'default'
      }
      export class LocalClass {
        static value = 'value';
      }
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() enumValue: keyof typeof LocalEnum;
        @Prop() classValue: keyof typeof LocalClass;
      }
    `);

    expect(t.properties.find((prop) => prop.name === 'enumValue')?.complexType.references).toEqual({
      LocalEnum: { location: 'local', path: 'module.tsx', id: 'module.tsx::LocalEnum' },
    });
    expect(t.properties.find((prop) => prop.name === 'classValue')?.complexType.references).toEqual(
      {
        LocalClass: { location: 'local', path: 'module.tsx', id: 'module.tsx::LocalClass' },
      },
    );
  });

  it('tracks imported enum and class references used by type queries', () => {
    const inputFileName = normalizePath(
      resolve('src/compiler/transformers/_test_/type-query-module.ts'),
      false,
    );
    const input = `
      import { BestEnum as ImportedEnum } from './fixtures/meal-entry';
      import { BestClass as ImportedClass } from './fixtures/meal-entry';
      class TypeQueryFixture {
        enumValue: keyof typeof ImportedEnum;
        classValue: keyof typeof ImportedClass;
      }
    `;
    const options: ts.CompilerOptions = {
      ...ts.getDefaultCompilerOptions(),
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      target: ts.ScriptTarget.Latest,
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    const fileExists = host.fileExists.bind(host);
    const readFile = host.readFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
      fileName === inputFileName
        ? ts.createSourceFile(fileName, input, languageVersion, true, ts.ScriptKind.TS)
        : getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    host.fileExists = (fileName) => fileName === inputFileName || fileExists(fileName);
    host.readFile = (fileName) => (fileName === inputFileName ? input : readFile(fileName));

    const program = ts.createProgram([inputFileName], options, host);
    const sourceFile = program.getSourceFile(inputFileName)!;
    const fixture = sourceFile.statements.find(ts.isClassDeclaration)!;
    const getReferences = (propertyName: string) => {
      const property = fixture.members.find(
        (member): member is ts.PropertyDeclaration =>
          ts.isPropertyDeclaration(member) && member.name.getText() === propertyName,
      )!;
      return getAttributeTypeInfo(property, sourceFile, program.getTypeChecker(), program);
    };

    expect(getReferences('enumValue').ImportedEnum).toMatchObject({
      location: 'import',
      path: './fixtures/meal-entry',
      referenceLocation: 'BestEnum',
    });
    expect(getReferences('classValue').ImportedClass).toMatchObject({
      location: 'import',
      path: './fixtures/meal-entry',
      referenceLocation: 'BestClass',
    });
  });

  it('generates imports for default and aliased exports used by type queries', async () => {
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
    const componentDir = join(srcDir, 'components');

    await config.sys.createDir(componentDir, { recursive: true });
    await config.sys.writeFile(
      tsconfigPath,
      JSON.stringify({
        compilerOptions: {
          experimentalDecorators: true,
          jsx: 'react',
          jsxFactory: 'h',
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
        interface Array<T> {}
        interface Boolean {}
        interface CallableFunction {}
        interface Function {}
        interface IArguments {}
        interface NewableFunction {}
        interface Number {}
        interface Object {}
        interface RegExp {}
        interface String {}
      `,
    );
    // `generateJsonDocs` resolves this relative to `sys.getCompilerExecutingPath()`
    // ('bin/stencil.js' in the mock sys), i.e. `<root>/declarations/stencil-public-docs.d.ts`.
    await config.sys.writeFile(
      join('declarations', 'stencil-public-docs.d.ts'),
      'export interface JsonDocs {}',
    );
    await config.sys.writeFile(
      join(componentDir, 'assigned-class.ts'),
      `
        class AssignedClass {
          static value = 'value';
        }
        export default AssignedClass;
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'direct-class.ts'),
      `
        export default class DirectClass {
          static value = 'value';
        }
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'default-enum.ts'),
      `
        enum DefaultEnum {
          Value = 'value'
        }
        export default DefaultEnum;
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'shared-class.ts'),
      `
        export default class SharedClass {
          static value = 'value';
        }
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'shared-enum.ts'),
      `
        enum SharedEnum {
          Value = 'value'
        }
        export default SharedEnum;
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'named.ts'),
      `
        export enum NamedEnum {
          Value = 'value'
        }
        export class OriginalClass {
          static value = 'external';
        }
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'a.ts'),
      `
        export enum Mode {
          A = 'a'
        }
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'b.ts'),
      `
        export enum Mode {
          B = 'b'
        }
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'barrel.ts'),
      `
        export { Mode as FirstMode } from './a';
        export { Mode as SecondMode } from './b';
      `,
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
      join(componentDir, 'cmp-a.tsx'),
      `
        import { Component, Prop } from '@stencil/core';
        import AssignedAlias from './assigned-class';
        import DirectAlias from './direct-class';
        import EnumAlias from './default-enum';

        export default class LocalDefault {
          static value = 'value';
        }
        class LocalAlias {
          static value = 'value';
        }
        export { LocalAlias as PublicAlias };

        @Component({ tag: 'cmp-a' })
        export class CmpA {
          @Prop() assigned: Array<keyof typeof AssignedAlias>;
          @Prop() direct: keyof typeof DirectAlias;
          @Prop() enumValue: keyof typeof EnumAlias;
          @Prop() localDefault: keyof typeof LocalDefault;
          @Prop() localAlias: keyof typeof LocalAlias;
        }
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'cmp-first.tsx'),
      `
        import { Component, Prop } from '@stencil/core';
        import FirstClass from './shared-class';
        import FirstEnum from './shared-enum';

        @Component({ tag: 'cmp-first' })
        export class CmpFirst {
          @Prop() firstClass: keyof typeof FirstClass;
          @Prop() firstEnum: keyof typeof FirstEnum;
        }
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'cmp-second.tsx'),
      `
        import { Component, Prop } from '@stencil/core';
        import SecondClass from './shared-class';
        import SecondEnum from './shared-enum';

        @Component({ tag: 'cmp-second' })
        export class CmpSecond {
          @Prop() secondClass: keyof typeof SecondClass;
          @Prop() secondEnum: keyof typeof SecondEnum;
        }
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'cmp-shadow.tsx'),
      `
        import { Component, Prop } from '@stencil/core';
        import { NamedEnum as NamedAlias } from './named';
        export { OriginalClass as PublicShadow } from './named';

        export class OriginalClass {
          static value = 'local';
        }

        @Component({ tag: 'cmp-shadow' })
        export class CmpShadow {
          @Prop() namedEnum: keyof typeof NamedAlias;
          @Prop() localClass: keyof typeof OriginalClass;
        }
      `,
    );
    await config.sys.writeFile(
      join(componentDir, 'cmp-barrel.tsx'),
      `
        import { Component, Prop } from '@stencil/core';
        import { FirstMode, SecondMode } from './barrel';

        @Component({ tag: 'cmp-barrel' })
        export class CmpBarrel {
          @Prop() firstMode: keyof typeof FirstMode;
          @Prop() secondMode: keyof typeof SecondMode;
        }
      `,
    );

    const originalCwd = process.cwd();
    // Mirrors what `loadConfig()` does for a real CLI build: parse the on-disk tsconfig.json
    // into `tsCompilerOptions` so options like `moduleResolution` are actually honored below.
    const tsConfigResults = await validateTsConfig({ ...config, tsconfig: tsconfigPath }, sys);
    const compiler = await createCompiler({
      ...config,
      tsconfig: tsconfigPath,
      tsCompilerOptions: tsConfigResults.compilerOptions,
    });
    try {
      const results = await compiler.build();
      expect(results.diagnostics.filter((diagnostic) => diagnostic.level === 'error')).toEqual([]);

      const componentsDts = await compiler.sys.readFile(join(srcDir, 'components.d.ts'));
      expect(componentsDts).toContain('import AssignedAlias from "./components/assigned-class";');
      expect(componentsDts).toContain('import DirectAlias from "./components/direct-class";');
      expect(componentsDts).toContain('import EnumAlias from "./components/default-enum";');
      expect(componentsDts).toContain(
        'import LocalDefault, { PublicAlias as LocalAlias } from "./components/cmp-a";',
      );
      expect(componentsDts).toContain('import FirstClass from "./components/shared-class";');
      expect(componentsDts).toContain('import SecondClass from "./components/shared-class";');
      expect(componentsDts).toContain('import FirstEnum from "./components/shared-enum";');
      expect(componentsDts).toContain('import SecondEnum from "./components/shared-enum";');
      expect(componentsDts).toContain(
        'import { NamedEnum as NamedAlias } from "./components/named";',
      );
      expect(componentsDts).toContain(
        'import { FirstMode, SecondMode } from "./components/barrel";',
      );
      expect(componentsDts).not.toContain(', { } from');
      expect(componentsDts).toContain('"firstClass": keyof typeof FirstClass;');
      expect(componentsDts).toContain('"secondClass": keyof typeof SecondClass;');
      expect(componentsDts).toContain('"firstEnum": keyof typeof FirstEnum;');
      expect(componentsDts).toContain('"secondEnum": keyof typeof SecondEnum;');

      const generatedDiagnostics = ts.transpileModule(componentsDts, {
        fileName: 'components.ts',
        reportDiagnostics: true,
      }).diagnostics;
      expect(
        generatedDiagnostics?.filter(
          (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
        ),
      ).toEqual([]);

      const docsJson = JSON.parse(await compiler.sys.readFile(join(rootDir, 'docs.json')));
      const barrelComponent = docsJson.components.find(
        (component: { tag: string }) => component.tag === 'cmp-barrel',
      );
      const getBarrelReference = (propertyName: string, referenceName: string) =>
        barrelComponent.props.find((property: { name: string }) => property.name === propertyName)
          .complexType.references[referenceName];
      const firstModeReference = getBarrelReference('firstMode', 'FirstMode');
      const secondModeReference = getBarrelReference('secondMode', 'SecondMode');
      expect(firstModeReference).toMatchObject({
        location: 'import',
        path: './barrel',
        referenceLocation: 'FirstMode',
      });
      expect(secondModeReference).toMatchObject({
        location: 'import',
        path: './barrel',
        referenceLocation: 'SecondMode',
      });
      expect(firstModeReference.id).not.toBe(secondModeReference.id);
      expect(docsJson.typeLibrary[firstModeReference.id]).toMatchObject({
        declaration: expect.stringContaining('enum Mode'),
        path: normalizePath(relative(process.cwd(), join(componentDir, 'a.ts')), false),
      });
      expect(docsJson.typeLibrary[firstModeReference.id].declaration).toContain("A = 'a'");
      expect(docsJson.typeLibrary[secondModeReference.id]).toMatchObject({
        declaration: expect.stringContaining('enum Mode'),
        path: normalizePath(relative(process.cwd(), join(componentDir, 'b.ts')), false),
      });
      expect(docsJson.typeLibrary[secondModeReference.id].declaration).toContain("B = 'b'");

      const getTypeDeclaration = (typeName: string): string | undefined => {
        const typeEntry = Object.entries(docsJson.typeLibrary).find(([id]) =>
          id.endsWith(`::${typeName}`),
        )?.[1] as { declaration?: string } | undefined;
        return typeEntry?.declaration;
      };
      expect(getTypeDeclaration('AssignedClass')).toContain('class AssignedClass');
      expect(getTypeDeclaration('DirectClass')).toContain('class DirectClass');
      expect(getTypeDeclaration('DefaultEnum')).toContain('enum DefaultEnum');
      expect(getTypeDeclaration('NamedEnum')).toContain('enum NamedEnum');
      expect(getTypeDeclaration('AssignedClass')).not.toBe('any');
      expect(componentsDts).toContain('import { OriginalClass } from "./components/cmp-shadow";');
      expect(componentsDts).not.toContain('PublicShadow as OriginalClass');
    } finally {
      process.chdir(originalCwd);
      await compiler.destroy();
    }
  });

  it('ignores type queries for arbitrary values and value aliases', () => {
    const t = transpileModule(`
      const LocalValue = { value: 'value' } as const;
      function LocalFunction() {
        return 'value';
      }
      class SomeClass {
        static value = 'value';
      }
      const ClassAlias = SomeClass;
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() objectValue: keyof typeof LocalValue;
        @Prop() functionValue: keyof typeof LocalFunction;
        @Prop() classAlias: keyof typeof ClassAlias;
      }
    `);

    const getReferences = (propertyName: string) =>
      t.properties.find((property) => property.name === propertyName)?.complexType.references;
    expect(getReferences('objectValue')).toEqual({});
    expect(getReferences('functionValue')).toEqual({});
    expect(getReferences('classAlias')).toEqual({});
  });

  it('should correctly parse a prop with an unresolved type', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val?: Foo;
      }
    `);
    // TS6 resolves unknown types as `any` (more accurate than preserving the name)
    // The original name is still preserved in `original` and `references`
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {
            Foo: {
              id: 'global::Foo',
              location: 'global',
            },
          },
          resolved: 'any',
          original: 'Foo',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: true,
        reflect: false,
        required: false,
        type: 'any',
        getter: false,
        setter: false,
      },
    });
  });

  it('prop required', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val!: string;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'string',
          original: 'string',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: false,
        reflect: false,
        required: true,
        type: 'string',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.required).toBe(true);
  });

  it('prop mutable', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop({ mutable: true }) val: string;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'string',
          original: 'string',
        },
        defaultValue: undefined,
        docs: {
          text: '',
          tags: [],
        },
        mutable: true,
        optional: false,
        reflect: false,
        required: false,
        type: 'string',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.mutable).toBe(true);
  });

  it('prop reflectAttr', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop({ reflect: true }) val: string;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'string',
          original: 'string',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: false,
        reflect: true,
        required: false,
        type: 'string',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.reflect).toBe(true);
    expect(t.cmp?.hasReflect).toBe(true);
  });

  it('prop array', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string[];
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        complexType: {
          references: {},
          resolved: 'string[]',
          original: 'string[]',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: false,
        required: false,
        type: 'unknown',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('unknown');
    expect(t.property?.attribute).toBe(undefined);
    expect(t.property?.reflect).toBe(false);
  });

  it('prop object', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: Object;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {
            Object: {
              location: 'global',
              id: 'global::Object',
            },
          },
          resolved: 'Object',
          original: 'Object',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'any',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('any');
    expect(t.property?.attribute).toBe('val');
    expect(t.property?.reflect).toBe(false);
  });

  it('prop multiword', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() multiWord: string;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      multiWord: {
        attribute: 'multi-word',
        complexType: {
          references: {},
          resolved: 'string',
          original: 'string',
        },
        docs: {
          text: '',
          tags: [],
        },
        defaultValue: undefined,
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'string',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.name).toBe('multiWord');
    expect(t.property?.attribute).toBe('multi-word');
  });

  it('prop w/ string type', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'string',
          original: 'string',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'string',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('string');
    expect(t.property?.attribute).toBe('val');
  });

  it('prop w/ number type', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: number;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'number',
          original: 'number',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'number',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('number');
    expect(t.property?.attribute).toBe('val');
  });

  it('prop w/ boolean type', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: boolean;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'boolean',
          original: 'boolean',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'boolean',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('boolean');
    expect(t.property?.attribute).toBe('val');
  });

  it('prop w/ any type', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: any;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'any',
          original: 'any',
        },
        docs: {
          text: '',
          tags: [],
        },
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'any',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('any');
    expect(t.property?.attribute).toBe('val');
  });

  it('prop w/ inferred string type', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val = 'mph';
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'string',
          original: 'string',
        },
        docs: {
          text: '',
          tags: [],
        },
        defaultValue: `'mph'`,
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'string',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('string');
    expect(t.property?.attribute).toBe('val');
  });

  it('prop w/ inferred number type', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val = 88;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'number',
          original: 'number',
        },
        docs: {
          text: '',
          tags: [],
        },
        defaultValue: '88',
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'number',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('number');
    expect(t.property?.attribute).toBe('val');
  });

  it('prop w/ inferred boolean type', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val = false;
      }
    `);
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'boolean',
          original: 'boolean',
        },
        docs: {
          text: '',
          tags: [],
        },
        defaultValue: 'false',
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'boolean',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('boolean');
    expect(t.property?.attribute).toBe('val');
  });

  it('prop w/ inferred any type from null', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val = null;
      }
    `);

    // TS6 correctly infers `null` as its own type, not `any`
    // Props with null values have no attribute (can't reflect null)
    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        complexType: {
          references: {},
          resolved: 'null',
          original: 'null',
        },
        docs: {
          text: '',
          tags: [],
        },
        defaultValue: 'null',
        mutable: false,
        optional: false,
        required: false,
        type: 'unknown',
        getter: false,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('unknown');
    expect(t.property?.attribute).toBe(undefined);
  });

  it('prop default value resolved from const string variable', () => {
    const t = transpileModule(`
      const DEFAULT_LABEL = 'Submit';
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() label: string = DEFAULT_LABEL;
      }
    `);
    expect(t.property?.defaultValue).toBe(`'Submit'`);
  });

  it('prop default value resolved from const number variable', () => {
    const t = transpileModule(`
      const DEFAULT_COUNT = 4;
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() count: number = DEFAULT_COUNT;
      }
    `);
    expect(t.property?.defaultValue).toBe('4');
  });

  it('prop default value resolved from object property access', () => {
    const t = transpileModule(`
      const CONFIG = { label: 'Hello' };
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() label: string = CONFIG.label;
      }
    `);
    expect(t.property?.defaultValue).toBe(`'Hello'`);
  });

  it('prop default value resolved from indexed object access (FW-7298)', () => {
    const t = transpileModule(`
      const QUERY: { [key: string]: string } = {
        lg: '(min-width: 992px)',
      };
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() when: string | boolean = QUERY['lg'];
      }
    `);
    expect(t.property?.defaultValue).toBe(`'(min-width: 992px)'`);
  });

  it('prop default value falls back to raw text when initializer is not a resolvable literal', () => {
    const t = transpileModule(`
      const computeDefault = () => 'x';
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string = computeDefault();
      }
    `);
    expect(t.property?.defaultValue).toBe('computeDefault()');
  });

  it('prop default value falls back to raw text for dynamic (non-literal) indexed access', () => {
    const t = transpileModule(`
      const QUERY: { [key: string]: string } = { lg: '(min-width: 992px)' };
      const key = 'lg';
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() when: string = QUERY[key];
      }
    `);
    expect(t.property?.defaultValue).toBe('QUERY[key]');
  });

  it('prop default value preserves `undefined` initializer as raw text', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string | undefined = undefined;
      }
    `);
    expect(t.property?.defaultValue).toBe('undefined');
  });

  it('prop default value resolved through an object shorthand property', () => {
    const t = transpileModule(`
      const label = 'Hello';
      const CONFIG = { label };
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string = CONFIG.label;
      }
    `);
    expect(t.property?.defaultValue).toBe(`'Hello'`);
  });

  it('prop default value resolved through `as const` wrapper', () => {
    const t = transpileModule(`
      const DEFAULT = 'x' as const;
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: 'x' = DEFAULT;
      }
    `);
    expect(t.property?.defaultValue).toBe(`'x'`);
  });

  it('prop default value resolved through parenthesized + non-null wrappers', () => {
    const t = transpileModule(`
      const DEFAULT: string | undefined = 'wrapped';
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string = (DEFAULT)!;
      }
    `);
    expect(t.property?.defaultValue).toBe(`'wrapped'`);
  });

  it('prop default value resolved through a `const` initialized to undefined', () => {
    const t = transpileModule(`
      const DEFAULT = undefined;
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string | undefined = DEFAULT;
      }
    `);
    expect(t.property?.defaultValue).toBe('undefined');
  });

  it('prop default value resolved from a negative numeric const (PrefixUnaryExpression)', () => {
    const t = transpileModule(`
      const N = -1;
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: number = N;
      }
    `);
    expect(t.property?.defaultValue).toBe('-1');
  });

  it('prop default value resolved from a wrapped object literal const', () => {
    const t = transpileModule(`
      const CONFIG = ({ label: 'wrapped' } as const);
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string = CONFIG.label;
      }
    `);
    expect(t.property?.defaultValue).toBe(`'wrapped'`);
  });

  it('prop default value resolved through chained const-to-const object aliases', () => {
    const t = transpileModule(`
      const CONFIG = { label: 'chained' };
      const ALIAS = CONFIG;
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string = ALIAS.label;
      }
    `);
    expect(t.property?.defaultValue).toBe(`'chained'`);
  });

  it('prop default value resolved to an object literal const through `satisfies`', () => {
    const t = transpileModule(`
      type Cols = { xs: number; sm: number };
      const DEFAULT_COLUMNS = { xs: 2, sm: 3 } satisfies Cols;
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() columns: Cols = DEFAULT_COLUMNS;
      }
    `);
    expect(t.property?.defaultValue).toBe(`{ xs: 2, sm: 3 }`);
  });

  it('prop default value resolved to an array literal const', () => {
    const t = transpileModule(`
      const DEFAULTS = [1, 2, 3];
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() vals: number[] = DEFAULTS;
      }
    `);
    expect(t.property?.defaultValue).toBe(`[1, 2, 3]`);
  });

  it('falls back to getText() at a chain depth over MAX_RESOLVE_DEPTH', () => {
    // Chain length intentionally exceeds the resolver's MAX_RESOLVE_DEPTH guard
    // (`A -> B -> C -> D -> E -> F -> G -> 'deep'`). The resolver must bail out
    // and the emitted default falls back to the original source text (`A`).
    const t = transpileModule(`
      const G = 'deep';
      const F = G;
      const E = F;
      const D = E;
      const C = D;
      const B = C;
      const A = B;
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string = A;
      }
    `);
    expect(t.property?.defaultValue).toBe('A');
  });

  it('prop default value resolved when the element-access key is itself wrapped', () => {
    const t = transpileModule(`
      const QUERY: { [key: string]: string } = { lg: '(min-width: 992px)' };
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() when: string = QUERY[('lg' as const)];
      }
    `);
    expect(t.property?.defaultValue).toBe(`'(min-width: 992px)'`);
  });

  it('prop default value resolved from a cross-file imported const', () => {
    // Self-contained 2-file program. Does NOT extend the shared `transpileModule`
    // helper — keeps the multi-file complexity isolated to this single test.
    const moduleSrc = `
      import { QUERY } from './queries';
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() when: string | boolean = QUERY['lg'];
      }
    `;
    const queriesSrc = `export const QUERY: { [key: string]: string } = { lg: '(min-width: 992px)' };`;
    const target = ts.ScriptTarget.Latest;
    const files = new Map<string, ts.SourceFile>([
      ['module.tsx', ts.createSourceFile('module.tsx', moduleSrc, target, true, ts.ScriptKind.TSX)],
      ['queries.ts', ts.createSourceFile('queries.ts', queriesSrc, target, true, ts.ScriptKind.TS)],
    ]);
    let emitted = '';
    const host: ts.CompilerHost = {
      getSourceFile: (name) => files.get(name),
      writeFile: (path, data) => {
        if (path.endsWith('module.js')) emitted = data;
      },
      getDefaultLibFileName: () => 'lib.d.ts',
      useCaseSensitiveFileNames: () => false,
      getCanonicalFileName: (n) => n,
      getCurrentDirectory: () => '',
      getNewLine: () => '\n',
      fileExists: (name) => files.has(name),
      readFile: (name) =>
        name === 'module.tsx' ? moduleSrc : name === 'queries.ts' ? queriesSrc : '',
      directoryExists: () => true,
      getDirectories: () => [],
      resolveModuleNames: (names) =>
        names.map((n) => {
          const candidate = n.replace(/^\.\//, '');
          for (const ext of ['.ts', '.tsx', '.d.ts'] as const) {
            const fileName = candidate.endsWith(ext) ? candidate : `${candidate}${ext}`;
            if (files.has(fileName)) {
              return { resolvedFileName: fileName, extension: ext as ts.Extension };
            }
          }
          return undefined;
        }),
    };
    const program = ts.createProgram({
      rootNames: ['module.tsx', 'queries.ts'],
      options: {
        experimentalDecorators: true,
        jsx: ts.JsxEmit.React,
        jsxFactory: 'h',
        module: ts.ModuleKind.ESNext,
        noLib: true,
        suppressOutputPathCheck: true,
        target,
      },
      host,
    });
    const config = mockValidatedConfig();
    const buildCtx = mockBuildCtx(config);
    program.emit(program.getSourceFile('module.tsx'), undefined, undefined, undefined, {
      before: [
        convertDecoratorsToStatic(config, buildCtx.diagnostics, program.getTypeChecker(), program),
      ],
    });
    // Assert the literal made it into the emitted `static get properties()` block.
    expect(emitted).toMatch(/"defaultValue":\s*"'\(min-width: 992px\)'"/);
  });

  it('should infer string type from `get()` return value', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop()
        get val() {
          return 'hello';
        };
      }
    `);

    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'string',
          original: 'string',
        },
        docs: {
          text: '',
          tags: [],
        },
        defaultValue: `'hello'`,
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'string',
        getter: true,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('string');
    expect(t.property?.attribute).toBe('val');
  });

  it('should infer number type from `get()` property access expression', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        private _numberVal = 3;
        @Prop()
        get val() {
          return this._numberVal;
        };
      }
    `);

    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'number',
          original: 'number',
        },
        docs: {
          text: '',
          tags: [],
        },
        defaultValue: `3`,
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'number',
        getter: true,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('number');
    expect(t.property?.attribute).toBe('val');
  });

  it('should infer boolean type from `get()` property access expression', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        private _boolVal = false;
        @Prop()
        get val() {
          return this._boolVal;
        };
      }
    `);

    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'boolean',
          original: 'boolean',
        },
        docs: {
          text: '',
          tags: [],
        },
        defaultValue: `false`,
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'boolean',
        getter: true,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('boolean');
    expect(t.property?.attribute).toBe('val');
  });

  it('should correctly parse a get / set prop with an inferred enum type', () => {
    const t = transpileModule(`
    export enum Mode {
      DEFAULT = 'default'
    }
    @Component({tag: 'cmp-a'})
      export class CmpA {
        private _val: Mode;
        @Prop()
        get val() {
          return this._val;
        };
      }
    `);

    // Using the `properties` array directly here since the `transpileModule`
    // method doesn't like the top-level enum export with the current `target` and
    // `module` values for the tsconfig
    expect(t.properties[0]).toEqual({
      name: 'val',
      type: 'string',
      attribute: 'val',
      reflect: false,
      mutable: false,
      required: false,
      optional: false,
      defaultValue: undefined,
      complexType: {
        original: 'Mode',
        resolved: 'Mode',
        references: {
          Mode: { location: 'local', path: 'module.tsx', id: 'module.tsx::Mode' },
        },
      },
      docs: { tags: [], text: '' },
      internal: false,
      getter: true,
      setter: false,
    });
  });

  it('should correctly parse a get / set prop with an inferred literal type', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        private _val: 'Something' | 'Else' = 'Something';
        @Prop()
        get val() {
          return this._val;
        };
      }
    `);

    expect(t.properties[0]).toEqual({
      name: 'val',
      type: 'string',
      attribute: 'val',
      reflect: false,
      mutable: false,
      required: false,
      optional: false,
      defaultValue: "'Something'",
      complexType: {
        original: '"Something" | "Else"',
        resolved: '"Else" | "Something"',
        references: {},
      },
      docs: { tags: [], text: '' },
      internal: false,
      getter: true,
      setter: false,
    });
  });

  it('should not infer type from `get()` property access expression when getter type is explicit', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        private _boolVal: boolean = false;
        @Prop()
        get val(): string {
          return this._boolVal;
        };
      }
    `);

    expect(getStaticGetter(t.outputText, 'properties')).toEqual({
      val: {
        attribute: 'val',
        complexType: {
          references: {},
          resolved: 'string',
          original: 'string',
        },
        docs: {
          text: '',
          tags: [],
        },
        defaultValue: `false`,
        mutable: false,
        optional: false,
        reflect: false,
        required: false,
        type: 'string',
        getter: true,
        setter: false,
      },
    });
    expect(t.property?.type).toBe('string');
    expect(t.property?.attribute).toBe('val');
  });

  it('deals appropriately with dynamic property names', async () => {
    // we're looking for `ogPropName` to be set on the dynamic prop

    const t = transpileModule(`
      const dynVal = 'val2';
       @Component({tag: 'cmp-a'})
       export class CmpA {
         @Prop() val = 'good';
         @Prop() [dynVal] = 'nice';
       }
     `);

    expect(await formatCode(t.outputText)).toBe(
      await c`var _a;
    const dynVal = 'val2';
    export class CmpA {
      constructor() {
        this.val = 'good';
        this[_a] = 'nice';
      }
      static get is() {
        return 'cmp-a';
      }
      static get properties() {
        return {
          val: {
            type: 'string',
            mutable: false,
            complexType: { original: 'string', resolved: 'string', references: {} },
            required: false,
            optional: false,
            docs: { tags: [], text: '' },
            getter: false,
            setter: false,
            reflect: false,
            attribute: 'val',
            defaultValue: \"'good'\",
          },
          val2: {
            type: 'string',
            mutable: false,
            complexType: { original: 'string', resolved: 'string', references: {} },
            required: false,
            optional: false,
            docs: { tags: [], text: '' },
            getter: false,
            setter: false,
            ogPropName: 'dynVal',
            reflect: false,
            attribute: 'val-2',
            defaultValue: \"'nice'\",
          },
        };
      }
    }
    _a = dynVal;`,
    );
  });

  it('should merge extended class property meta', async () => {
    const t = transpileModule(
      `
      @Component({tag: 'cmp-a'})
      class CmpA extends Parent {
        @Prop() foo: string = 'cmp a foo';
      }
      class Parent extends GrandParent {
        @Prop() foo: string = 'parent foo';
        @Prop() bar: string = 'parent bar';
      }
      class GrandParent {
        @Prop() bar: string = 'grandparent bar';
        @Prop() baz: string = 'grandparent baz';
      }
    `,
      undefined,
      undefined,
      [],
      [],
      [],
      { target: ts.ScriptTarget.ESNext },
    );

    expect(t.properties).toEqual([
      {
        attribute: 'baz',
        complexType: {
          original: 'string',
          references: {},
          resolved: 'string',
        },
        defaultValue: "'grandparent baz'",
        docs: {
          tags: [],
          text: '',
        },
        getter: false,
        internal: false,
        mutable: false,
        name: 'baz',
        optional: false,
        reflect: false,
        required: false,
        setter: false,
        type: 'string',
      },
      {
        attribute: 'bar',
        complexType: {
          original: 'string',
          references: {},
          resolved: 'string',
        },
        defaultValue: "'parent bar'",
        docs: {
          tags: [],
          text: '',
        },
        getter: false,
        internal: false,
        mutable: false,
        name: 'bar',
        optional: false,
        reflect: false,
        required: false,
        setter: false,
        type: 'string',
      },
      {
        attribute: 'foo',
        complexType: {
          original: 'string',
          references: {},
          resolved: 'string',
        },
        defaultValue: "'cmp a foo'",
        docs: {
          tags: [],
          text: '',
        },
        getter: false,
        internal: false,
        mutable: false,
        name: 'foo',
        optional: false,
        reflect: false,
        required: false,
        setter: false,
        type: 'string',
      },
    ]);
  });
});
