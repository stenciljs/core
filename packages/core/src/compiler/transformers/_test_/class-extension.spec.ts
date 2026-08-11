import {
  mockBuildCtx,
  mockCompilerCtx,
  mockModule,
  mockValidatedConfig,
} from '@stencil/core/testing';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import {
  extractInheritedMeta,
  mergeExtendedClassMeta,
  mergeExtendedClassMetaWithResolveImport,
  reanchorInheritedTypeReferences,
} from '../static-to-meta/class-extension';
import { isStaticGetter } from '../transform-utils';

// Helper: run with a .tsx filename (decorator syntax path)
const fromDecorators = (code: string, className = 'Base') =>
  extractInheritedMeta(code, className, 'base.tsx');

// Helper: run with a .js filename (static getter path)
const fromStaticGetters = (code: string, className = 'Base') =>
  extractInheritedMeta(code, className, 'base.js');

describe('extractInheritedMeta', () => {
  it('returns null when className is not found', () => {
    expect(fromDecorators(`export class Other {}`, 'Missing')).toBeNull();
  });

  // Decorator syntax

  describe('decorator syntax — @Prop', () => {
    it('extracts a basic prop with derived attribute', () => {
      const result = fromDecorators(`
        import { Prop } from '@stencil/core';
        export class Base {
          @Prop() myValue: string;
        }
      `);
      expect(result?.properties).toHaveLength(1);
      const p = result!.properties[0];
      expect(p.name).toBe('myValue');
      expect(p.attribute).toBe('my-value');
      expect(p.reflect).toBe(false);
      expect(p.mutable).toBe(false);
      expect(p.optional).toBe(false);
    });

    it('respects explicit attribute, reflect, and mutable options', () => {
      const result = fromDecorators(`
        export class Base {
          @Prop({ attribute: 'MY-ATTR', reflect: true, mutable: true }) val: string;
        }
      `);
      const p = result!.properties[0];
      expect(p.attribute).toBe('my-attr'); // lowercased
      expect(p.reflect).toBe(true);
      expect(p.mutable).toBe(true);
    });

    it('marks optional props', () => {
      const result = fromDecorators(`
        export class Base {
          @Prop() required: string;
          @Prop() optional?: string;
        }
      `);
      expect(result!.properties.find((p) => p.name === 'required')!.optional).toBe(false);
      expect(result!.properties.find((p) => p.name === 'optional')!.optional).toBe(true);
    });
  });

  describe('decorator syntax — @State', () => {
    it('extracts state names', () => {
      const result = fromDecorators(`
        export class Base {
          @State() count: number;
          @State() isOpen: boolean;
        }
      `);
      expect(result!.states.map((s) => s.name)).toEqual(['count', 'isOpen']);
    });
  });

  describe('decorator syntax — @Event', () => {
    it('defaults event name to the member name', () => {
      const result = fromDecorators(`
        export class Base {
          @Event() myChange: any;
        }
      `);
      const e = result!.events[0];
      expect(e.name).toBe('myChange');
      expect(e.method).toBe('myChange');
      expect(e.bubbles).toBe(true);
      expect(e.cancelable).toBe(true);
      expect(e.composed).toBe(false);
    });

    it('uses explicit eventName when provided', () => {
      const result = fromDecorators(`
        export class Base {
          @Event({ eventName: 'my-custom-event', bubbles: false, composed: true }) change: any;
        }
      `);
      const e = result!.events[0];
      expect(e.name).toBe('my-custom-event');
      expect(e.method).toBe('change');
      expect(e.bubbles).toBe(false);
      expect(e.composed).toBe(true);
    });
  });

  describe('decorator syntax — @Method', () => {
    it('extracts public method names', () => {
      const result = fromDecorators(`
        export class Base {
          @Method() async doSomething(): Promise<void> {}
          @Method() getValue(): string { return ''; }
        }
      `);
      expect(result!.methods.map((m) => m.name)).toEqual(['doSomething', 'getValue']);
    });
  });

  describe('decorator syntax — @Watch', () => {
    it('extracts watched prop and handler method name', () => {
      const result = fromDecorators(`
        export class Base {
          @Watch('myProp') onMyPropChange(val: string) {}
        }
      `);
      expect(result!.watchers).toEqual([{ propName: 'myProp', methodName: 'onMyPropChange' }]);
    });
  });

  describe('decorator syntax — @Listen', () => {
    it('extracts basic listener', () => {
      const result = fromDecorators(`
        export class Base {
          @Listen('click') handleClick() {}
        }
      `);
      const l = result!.listeners[0];
      expect(l.name).toBe('click');
      expect(l.method).toBe('handleClick');
      expect(l.capture).toBe(false);
      expect(l.passive).toBe(false);
      expect(l.target).toBeUndefined();
    });

    it('extracts listener options including target', () => {
      const result = fromDecorators(`
        export class Base {
          @Listen('scroll', { capture: true, passive: true, target: 'window' }) onScroll() {}
        }
      `);
      const l = result!.listeners[0];
      expect(l.capture).toBe(true);
      expect(l.passive).toBe(true);
      expect(l.target).toBe('window');
    });
  });

  describe('lifecycle method names', () => {
    it('collects lifecycle method names from decorator-syntax class', () => {
      const result = fromDecorators(`
        export class Base {
          connectedCallback() {}
          componentDidLoad() {}
          render() { return null; }
          someHelper() {}
        }
      `);
      expect(result!.methodNames).toContain('connectedCallback');
      expect(result!.methodNames).toContain('componentDidLoad');
      expect(result!.methodNames).toContain('render');
      expect(result!.methodNames).toContain('someHelper');
    });
  });

  describe('decorator syntax — mixed class', () => {
    it('extracts all member types from one class', () => {
      const result = fromDecorators(`
        export class Base {
          @Prop() label: string;
          @State() count: number;
          @Event() changed: any;
          @Method() async reset(): Promise<void> {}
          @Watch('label') onLabel() {}
          @Listen('click') onClick() {}
          render() { return null; }
        }
      `);
      expect(result!.properties.map((p) => p.name)).toContain('label');
      expect(result!.states.map((s) => s.name)).toContain('count');
      expect(result!.events.map((e) => e.name)).toContain('changed');
      expect(result!.methods.map((m) => m.name)).toContain('reset');
      expect(result!.watchers[0].propName).toBe('label');
      expect(result!.listeners[0].name).toBe('click');
      expect(result!.methodNames).toContain('render');
    });
  });

  // Static getter syntax

  describe('static getter syntax (compiled collection .js)', () => {
    it('extracts props from static getter', () => {
      const result = fromStaticGetters(`
        class Base {
          static get properties() {
            return {
              label: { attribute: 'label', type: 'string', reflect: false, mutable: false },
              value: { attribute: 'my-value', type: 'number', reflect: true, mutable: true },
            };
          }
        }
      `);
      expect(result!.properties).toHaveLength(2);
      const label = result!.properties.find((p) => p.name === 'label')!;
      expect(label.attribute).toBe('label');
      expect(label.reflect).toBe(false);
      const value = result!.properties.find((p) => p.name === 'value')!;
      expect(value.attribute).toBe('my-value');
      expect(value.reflect).toBe(true);
      expect(value.mutable).toBe(true);
    });

    it('extracts states from static getter', () => {
      const result = fromStaticGetters(`
        class Base {
          static get states() { return { count: {}, isOpen: {} }; }
        }
      `);
      expect(result!.states.map((s) => s.name)).toEqual(['count', 'isOpen']);
    });

    it('extracts events from static getter array', () => {
      const result = fromStaticGetters(`
        class Base {
          static get events() {
            return [{
              name: 'myChange',
              method: 'myChange',
              bubbles: true,
              cancelable: true,
              composed: false,
              docs: { text: '', tags: [] },
              complexType: { original: 'any', resolved: 'any', references: {} },
            }];
          }
        }
      `);
      expect(result!.events).toHaveLength(1);
      expect(result!.events[0].name).toBe('myChange');
      expect(result!.events[0].bubbles).toBe(true);
    });

    it('extracts listeners from static getter array', () => {
      const result = fromStaticGetters(`
        class Base {
          static get listeners() {
            return [{ name: 'click', method: 'handleClick', capture: false, passive: false }];
          }
        }
      `);
      expect(result!.listeners[0].name).toBe('click');
      expect(result!.listeners[0].method).toBe('handleClick');
    });

    it('extracts watchers from static getter array', () => {
      const result = fromStaticGetters(`
        class Base {
          static get watchers() {
            return [{ propName: 'label', methodName: 'onLabelChange' }];
          }
        }
      `);
      expect(result!.watchers[0]).toEqual({ propName: 'label', methodName: 'onLabelChange' });
    });

    it('collects lifecycle method names alongside static getters', () => {
      const result = fromStaticGetters(`
        class Base {
          static get properties() { return { label: { attribute: 'label' } }; }
          connectedCallback() {}
          componentDidLoad() {}
        }
      `);
      expect(result!.methodNames).toContain('connectedCallback');
      expect(result!.methodNames).toContain('componentDidLoad');
    });
  });
});

describe('class-extension', () => {
  describe('reanchorInheritedTypeReferences', () => {
    const CMP_PATH = '/src/components/data-entry/checkbox/checkbox.tsx';
    const BASE_CLASS_PATH = '/src/components/shared/input/base-input.ts';

    const buildProperty = (
      references: d.ComponentCompilerTypeReferences,
    ): d.ComponentCompilerProperty =>
      ({
        name: 'validator',
        complexType: {
          original: 'Validator',
          resolved: 'Validator',
          references,
        },
      }) as d.ComponentCompilerProperty;

    it('re-anchors a relative import reference onto the component directory', () => {
      const property = buildProperty({
        Validator: {
          location: 'import',
          path: './input.types',
          id: 'src/components/shared/input/input.types.ts::Validator',
        },
      });

      reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

      expect(property.complexType.references['Validator']).toEqual({
        location: 'import',
        path: '../../shared/input/input.types',
        id: 'src/components/shared/input/input.types.ts::Validator',
      });
    });

    it('re-anchors a relative import when the extended class is in a subdirectory of the component', () => {
      const property = buildProperty({
        UtilType: {
          location: 'import',
          // relative to the base class in `shared/`, this resolves to /src/components/util-types
          path: '../util-types',
          id: 'src/components/util-types.ts::UtilType',
        },
      });

      reanchorInheritedTypeReferences(
        [property],
        '/src/components/shared/abstract-component.tsx',
        '/src/components/sub-component.tsx',
      );

      expect(property.complexType.references['UtilType']).toEqual({
        location: 'import',
        path: './util-types',
        id: 'src/components/util-types.ts::UtilType',
      });
    });

    it('re-anchors a relative import reference pointing outside the extended class directory', () => {
      const property = buildProperty({
        Validator: {
          location: 'import',
          // resolves to /src/utils/validation.types from the base class's directory
          path: '../../../utils/validation.types',
          id: 'src/utils/validation.types.ts::Validator',
        },
      });

      reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

      expect(property.complexType.references['Validator'].path).toBe(
        '../../../utils/validation.types',
      );
    });

    it('converts a local reference into an import of the extended class module', () => {
      const property = buildProperty({
        InputSize: {
          location: 'local',
          path: BASE_CLASS_PATH,
          id: 'src/components/shared/input/base-input.ts::InputSize',
        },
      });

      reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

      expect(property.complexType.references['InputSize']).toEqual({
        location: 'import',
        path: '../../shared/input/base-input',
        id: 'src/components/shared/input/base-input.ts::InputSize',
      });
    });

    it('prefixes "./" when the re-anchored specifier is not explicitly relative', () => {
      const property = buildProperty({
        Validator: {
          location: 'import',
          path: './input.types',
          id: 'src/components/input.types.ts::Validator',
        },
      });

      // base class in a parent directory of the component
      reanchorInheritedTypeReferences(
        [property],
        '/src/components/base-input.ts',
        '/src/checkbox.tsx',
      );

      expect(property.complexType.references['Validator'].path).toBe('./components/input.types');
    });

    it('leaves package import references untouched', () => {
      const reference: d.ComponentCompilerTypeReference = {
        location: 'import',
        path: '@my-org/types',
        id: 'node_modules::Validator',
      };
      const property = buildProperty({ Validator: { ...reference } });

      reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

      expect(property.complexType.references['Validator']).toEqual(reference);
    });

    it('leaves global references untouched', () => {
      const reference: d.ComponentCompilerTypeReference = {
        location: 'global',
        id: 'global::HTMLElement',
      };
      const property = buildProperty({ HTMLElement: { ...reference } });

      reanchorInheritedTypeReferences([property], BASE_CLASS_PATH, CMP_PATH);

      expect(property.complexType.references['HTMLElement']).toEqual(reference);
    });

    it('does not rewrite references when the extended class lives in the same directory', () => {
      const reference: d.ComponentCompilerTypeReference = {
        location: 'import',
        path: './input.types',
        id: 'src/components/data-entry/checkbox/input.types.ts::Validator',
      };
      const property = buildProperty({ Validator: { ...reference } });

      reanchorInheritedTypeReferences(
        [property],
        '/src/components/data-entry/checkbox/base.ts',
        CMP_PATH,
      );

      expect(property.complexType.references['Validator']).toEqual(reference);
    });

    it('re-anchors an import reference from a node_modules collection, swapping dist/collection for dist/types', () => {
      const property = buildProperty({
        Validator: {
          location: 'import',
          path: './input.types',
          id: 'node_modules::Validator',
        },
      });

      reanchorInheritedTypeReferences(
        [property],
        '/node_modules/@my-org/core/dist/collection/base-input.js',
        CMP_PATH,
      );

      expect(property.complexType.references['Validator']).toEqual({
        location: 'import',
        path: '../../../../node_modules/@my-org/core/dist/types/input.types',
        id: 'node_modules::Validator',
      });
    });

    it('converts a local reference from a node_modules collection into a dist/types import, stripping the .js extension', () => {
      const property = buildProperty({
        InputSize: {
          location: 'local',
          path: '/node_modules/@my-org/core/dist/collection/base-input.js',
          id: 'node_modules::InputSize',
        },
      });

      reanchorInheritedTypeReferences(
        [property],
        '/node_modules/@my-org/core/dist/collection/base-input.js',
        CMP_PATH,
      );

      expect(property.complexType.references['InputSize']).toEqual({
        location: 'import',
        path: '../../../../node_modules/@my-org/core/dist/types/base-input',
        id: 'node_modules::InputSize',
      });
    });

    it('leaves a node_modules import path untouched when it has no dist/collection segment to swap', () => {
      const property = buildProperty({
        Validator: {
          location: 'import',
          path: './input.types',
          id: 'node_modules::Validator',
        },
      });

      reanchorInheritedTypeReferences(
        [property],
        '/node_modules/@my-org/core/dist-custom-elements/base-input.js',
        CMP_PATH,
      );

      expect(property.complexType.references['Validator'].path).toBe(
        '../../../../node_modules/@my-org/core/dist-custom-elements/input.types',
      );
    });

    it('handles members without complex type references', () => {
      const method = { name: 'doSomething' } as d.ComponentCompilerMethod;

      expect(() =>
        reanchorInheritedTypeReferences([method], BASE_CLASS_PATH, CMP_PATH),
      ).not.toThrow();
    });
  });

  describe('mergeExtendedClassMeta', () => {
    it('re-anchors inherited type references end-to-end when the base class lives in a different directory', async () => {
      const config = mockValidatedConfig({ tsCompilerOptions: {} });
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);

      const baseFileName = '/src/components/shared/input/base-input.ts';
      await compilerCtx.fs.writeFile(baseFileName, `export class BaseInput {}`, {
        inMemoryOnly: true,
      });

      const baseSource = ts.createSourceFile(
        baseFileName,
        `export class BaseInput {
          static get properties() {
            return {
              "validator": {
                "complexType": {
                  "original": "Validator",
                  "resolved": "Validator",
                  "references": {
                    "Validator": { "location": "import", "path": "./input.types", "id": "x::Validator" }
                  }
                }
              }
            };
          }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      compilerCtx.moduleMap.set(
        baseFileName,
        mockModule({ sourceFilePath: baseFileName, staticSourceFile: baseSource }),
      );

      const cmpFileName = '/src/components/data-entry/checkbox/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { BaseInput } from '../../shared/input/base-input';
        export class Checkbox extends BaseInput {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpModule = mockModule({ sourceFilePath: cmpFileName, staticSourceFile: cmpSource });

      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const result = mergeExtendedClassMeta(
        compilerCtx,
        undefined as unknown as ts.TypeChecker,
        buildCtx,
        cmpClass,
        staticMembers,
        cmpModule,
      );

      expect(result.properties[0]?.complexType.references['Validator']).toEqual({
        location: 'import',
        path: '../../shared/input/input.types',
        id: 'x::Validator',
      });
    });
  });

  describe('mergeExtendedClassMetaWithResolveImport', () => {
    const config = mockValidatedConfig({ tsCompilerOptions: {} });

    it('resolves real complexType info for a decorator-syntax base class instead of falling back to any', () => {
      const cmpFileName = '/src/components/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { BaseInput } from './base-input';
        export class Checkbox extends BaseInput {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const baseCode = `
        import { Prop } from '@stencil/core';
        export class BaseInput {
          @Prop() count: number;
          @Prop() disabled: boolean;
        }
      `;

      const result = mergeExtendedClassMetaWithResolveImport(
        cmpClass,
        staticMembers,
        cmpSource,
        (specifier) =>
          specifier === './base-input'
            ? { code: baseCode, path: '/src/components/base-input.ts' }
            : null,
        config,
      );

      const countProp = result.properties.find((p) => p.name === 'count');
      const disabledProp = result.properties.find((p) => p.name === 'disabled');
      expect(countProp?.type).toBe('number');
      expect(disabledProp?.type).toBe('boolean');
    });

    it('re-anchors a base-class-local type reference relative to the component', () => {
      const cmpFileName = '/src/components/data-entry/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { BaseInput } from '../shared/base-input';
        export class Checkbox extends BaseInput {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const baseCode = `
        import { Prop } from '@stencil/core';
        export type Validator = 'required' | 'optional';
        export class BaseInput {
          @Prop() validator: Validator;
        }
      `;

      const result = mergeExtendedClassMetaWithResolveImport(
        cmpClass,
        staticMembers,
        cmpSource,
        (specifier) =>
          specifier === '../shared/base-input'
            ? { code: baseCode, path: '/src/components/shared/base-input.ts' }
            : null,
        config,
      );

      const validatorProp = result.properties.find((p) => p.name === 'validator');
      expect(validatorProp?.complexType.references['Validator']).toEqual({
        location: 'import',
        path: '../shared/base-input',
        id: expect.stringContaining('Validator'),
      });
    });

    // A type imported into the base class's file from a THIRD file can't be
    // followed by the mini single-file program (`noResolve: true`, matching
    // convertDiskSourceFileDecorators's existing, already-accepted limitation
    // elsewhere in this file) - the checker can't bind the symbol, so
    // getTypeReferenceLocation degrades it to 'global'. reclassifyGlobalTypeReferences
    // corrects the classification syntactically (it's genuinely imported, not
    // global) without needing the checker to have resolved it - downstream
    // consumers like @stencil/unplugin's docs pipeline resolve `path` themselves.
    it('reclassifies a type imported from a third file, relative to the component', () => {
      const cmpFileName = '/src/components/data-entry/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { BaseInput } from '../shared/base-input';
        export class Checkbox extends BaseInput {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const baseCode = `
        import { Prop } from '@stencil/core';
        import { Validator } from './input.types';
        export class BaseInput {
          @Prop() validator: Validator;
        }
      `;

      const result = mergeExtendedClassMetaWithResolveImport(
        cmpClass,
        staticMembers,
        cmpSource,
        (specifier, importer) => {
          if (specifier === '../shared/base-input') {
            return { code: baseCode, path: '/src/components/shared/base-input.ts' };
          }
          if (
            specifier === './input.types' &&
            importer === '/src/components/shared/base-input.ts'
          ) {
            return {
              code: `export type Validator = 'required' | 'optional';`,
              path: '/src/components/shared/input.types.ts',
            };
          }
          return null;
        },
        config,
      );

      const validatorProp = result.properties.find((p) => p.name === 'validator');
      expect(validatorProp?.complexType.references['Validator']).toEqual({
        location: 'import',
        path: '../shared/input.types',
        id: expect.stringContaining('Validator'),
      });
    });

    it('falls back to extractInheritedMeta when the mini-program conversion fails', () => {
      const cmpFileName = '/src/components/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { BaseInput } from './base-input';
        export class Checkbox extends BaseInput {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      // Unparseable decorator syntax - the mini-program transform will throw,
      // so this should still produce a result via the extractInheritedMeta fallback
      // rather than crashing the whole merge.
      const baseCode = `export class BaseInput { @Prop( count: number; }`;

      const result = mergeExtendedClassMetaWithResolveImport(
        cmpClass,
        staticMembers,
        cmpSource,
        (specifier) =>
          specifier === './base-input'
            ? { code: baseCode, path: '/src/components/base-input.ts' }
            : null,
        config,
      );

      expect(result.doesExtend).toBe(true);
    });
  });
});
