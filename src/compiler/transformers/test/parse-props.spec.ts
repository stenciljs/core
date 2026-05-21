import { mockBuildCtx, mockValidatedConfig } from '@stencil/core/testing';
import * as ts from 'typescript';

import { convertDecoratorsToStatic } from '../decorators-to-static/convert-decorators';
import { getStaticGetter, transpileModule } from './transpile';
import { c, formatCode } from './utils';

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
          resolved: 'string',
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

  it('should correctly parse a prop with an unresolved type', () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val?: Foo;
      }
    `);
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
          resolved: 'Foo',
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
          resolved: '{}', // TODO, needs to be string[]
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
        defaultValue: 'null',
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
      readFile: (name) => (name === 'module.tsx' ? moduleSrc : name === 'queries.ts' ? queriesSrc : ''),
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
      before: [convertDecoratorsToStatic(config, buildCtx.diagnostics, program.getTypeChecker(), program)],
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
