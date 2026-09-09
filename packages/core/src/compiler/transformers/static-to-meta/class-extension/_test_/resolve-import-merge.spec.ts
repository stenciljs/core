import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { extractInheritedMeta, mergeExtendedClassMetaWithResolveImport } from '..';
import { mockValidatedConfig } from '../../../../../testing';
import { mockBuildCtx } from '../../../../../testing/compiler';
import { isStaticGetter } from '../../../transform-utils';

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
        if (specifier === './input.types' && importer === '/src/components/shared/base-input.ts') {
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

  it('merges a mixin factory class extended via Mixin(...)', () => {
    const cmpFileName = '/src/components/checkbox.tsx';
    const cmpSource = ts.createSourceFile(
      cmpFileName,
      `import { Mixin } from '@stencil/core';
      import { FocusMixin } from './focus-mixin';
      export class Checkbox extends Mixin(FocusMixin) {
        static get is() { return 'my-checkbox'; }
      }`,
      ts.ScriptTarget.ESNext,
      true,
    );
    const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
    const staticMembers = cmpClass.members.filter(isStaticGetter);

    const mixinCode = `
      import { Prop } from '@stencil/core';
      export const FocusMixin = (Base) => {
        class FocusMixinClass extends Base {
          @Prop() isFocused: boolean;
        }
        return FocusMixinClass;
      };
    `;

    const result = mergeExtendedClassMetaWithResolveImport(
      cmpClass,
      staticMembers,
      cmpSource,
      (specifier) =>
        specifier === './focus-mixin'
          ? { code: mixinCode, path: '/src/components/focus-mixin.ts' }
          : null,
      config,
    );

    expect(result.doesExtend).toBe(true);
    const isFocusedProp = result.properties.find((p) => p.name === 'isFocused');
    expect(isFocusedProp?.type).toBe('boolean');
  });

  it('merges every mixin factory in a multi-argument Mixin(A, B)', () => {
    const cmpFileName = '/src/components/checkbox.tsx';
    const cmpSource = ts.createSourceFile(
      cmpFileName,
      `import { Mixin } from '@stencil/core';
      import { FocusMixin } from './focus-mixin';
      import { ValidationMixin } from './validation-mixin';
      export class Checkbox extends Mixin(FocusMixin, ValidationMixin) {
        static get is() { return 'my-checkbox'; }
      }`,
      ts.ScriptTarget.ESNext,
      true,
    );
    const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
    const staticMembers = cmpClass.members.filter(isStaticGetter);

    const focusCode = `
      import { Prop } from '@stencil/core';
      export const FocusMixin = (Base) => {
        class FocusMixinClass extends Base {
          @Prop() isFocused: boolean;
        }
        return FocusMixinClass;
      };
    `;
    const validationCode = `
      import { Prop } from '@stencil/core';
      export const ValidationMixin = (Base) => {
        class ValidationMixinClass extends Base {
          @Prop() isValid: boolean;
        }
        return ValidationMixinClass;
      };
    `;

    const result = mergeExtendedClassMetaWithResolveImport(
      cmpClass,
      staticMembers,
      cmpSource,
      (specifier) => {
        if (specifier === './focus-mixin') {
          return { code: focusCode, path: '/src/components/focus-mixin.ts' };
        }
        if (specifier === './validation-mixin') {
          return { code: validationCode, path: '/src/components/validation-mixin.ts' };
        }
        return null;
      },
      config,
    );

    expect(result.doesExtend).toBe(true);
    expect(result.properties.map((p) => p.name).sort()).toEqual(['isFocused', 'isValid']);
  });

  it('warns instead of silently dropping a mixin factory whose class is an unnamed arrow-body expression', () => {
    // `(Base) => class extends Base {}` isn't recognized as a mixin factory (only the
    // block-bodied `(Base) => { class Foo extends Base {} return Foo; }` form is) - this should
    // warn rather than silently applying none of the mixin's members with no explanation.
    const cmpFileName = '/src/components/checkbox.tsx';
    const cmpSource = ts.createSourceFile(
      cmpFileName,
      `import { Mixin } from '@stencil/core';
      import { FocusMixin } from './focus-mixin';
      export class Checkbox extends Mixin(FocusMixin) {
        static get is() { return 'my-checkbox'; }
      }`,
      ts.ScriptTarget.ESNext,
      true,
    );
    const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
    const staticMembers = cmpClass.members.filter(isStaticGetter);

    const mixinCode = `
      import { Prop } from '@stencil/core';
      export const FocusMixin = (Base) =>
        class extends Base {
          @Prop() isFocused: boolean;
        };
    `;

    const buildCtx = mockBuildCtx();

    const result = mergeExtendedClassMetaWithResolveImport(
      cmpClass,
      staticMembers,
      cmpSource,
      (specifier) =>
        specifier === './focus-mixin'
          ? { code: mixinCode, path: '/src/components/focus-mixin.ts' }
          : null,
      config,
      buildCtx,
    );

    expect(result.doesExtend).toBe(false);
    expect(result.properties).toHaveLength(0);
    expect(buildCtx.diagnostics).toHaveLength(1);
    expect(buildCtx.diagnostics[0].messageText).toContain('Found "FocusMixin"');
    expect(buildCtx.diagnostics[0].messageText).toContain("couldn't find a class declaration");
  });

  it('keeps resolving further ancestors when a Mixin(...) argument is a real class rather than a factory', () => {
    const cmpFileName = '/src/components/checkbox.tsx';
    const cmpSource = ts.createSourceFile(
      cmpFileName,
      `import { Mixin } from '@stencil/core';
      import { BaseInput } from './base-input';
      export class Checkbox extends Mixin(BaseInput) {
        static get is() { return 'my-checkbox'; }
      }`,
      ts.ScriptTarget.ESNext,
      true,
    );
    const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
    const staticMembers = cmpClass.members.filter(isStaticGetter);

    const baseInputCode = `
      import { Prop } from '@stencil/core';
      import { GrandparentInput } from './grandparent-input';
      export class BaseInput extends GrandparentInput {
        @Prop() disabled: boolean;
      }
    `;
    const grandparentCode = `
      import { Prop } from '@stencil/core';
      export class GrandparentInput {
        @Prop() name: string;
      }
    `;

    const result = mergeExtendedClassMetaWithResolveImport(
      cmpClass,
      staticMembers,
      cmpSource,
      (specifier, importer) => {
        if (specifier === './base-input') {
          return { code: baseInputCode, path: '/src/components/base-input.ts' };
        }
        if (specifier === './grandparent-input' && importer === '/src/components/base-input.ts') {
          return { code: grandparentCode, path: '/src/components/grandparent-input.ts' };
        }
        return null;
      },
      config,
    );

    expect(result.doesExtend).toBe(true);
    expect(result.properties.map((p) => p.name).sort()).toEqual(['disabled', 'name']);
  });

  describe('barrel / re-export resolution', () => {
    it('resolves a plain `extends` target reached through a barrel re-export, without warning', () => {
      const cmpFileName = '/src/components/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { BaseInput } from './shared';
        export class Checkbox extends BaseInput {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const barrelCode = `export { BaseInput } from './base-input';`;
      const baseInputCode = `
        import { Prop } from '@stencil/core';
        export class BaseInput {
          @Prop() disabled: boolean;
        }
      `;

      const buildCtx = mockBuildCtx();

      const result = mergeExtendedClassMetaWithResolveImport(
        cmpClass,
        staticMembers,
        cmpSource,
        (specifier, importer) => {
          if (specifier === './shared' && importer === cmpFileName) {
            return { code: barrelCode, path: '/src/components/shared.ts' };
          }
          if (specifier === './base-input' && importer === '/src/components/shared.ts') {
            return { code: baseInputCode, path: '/src/components/base-input.ts' };
          }
          return null;
        },
        config,
        buildCtx,
      );

      expect(result.doesExtend).toBe(true);
      expect(result.properties.map((p) => p.name)).toEqual(['disabled']);
      expect(buildCtx.diagnostics).toHaveLength(0);
    });

    it('resolves an aliased barrel re-export (`export { X as Y }`)', () => {
      const cmpFileName = '/src/components/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { Input } from './shared';
        export class Checkbox extends Input {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const barrelCode = `export { BaseInput as Input } from './base-input';`;
      const baseInputCode = `
        import { Prop } from '@stencil/core';
        export class BaseInput {
          @Prop() disabled: boolean;
        }
      `;

      const result = mergeExtendedClassMetaWithResolveImport(
        cmpClass,
        staticMembers,
        cmpSource,
        (specifier, importer) => {
          if (specifier === './shared' && importer === cmpFileName) {
            return { code: barrelCode, path: '/src/components/shared.ts' };
          }
          if (specifier === './base-input' && importer === '/src/components/shared.ts') {
            return { code: baseInputCode, path: '/src/components/base-input.ts' };
          }
          return null;
        },
        config,
      );

      expect(result.doesExtend).toBe(true);
      expect(result.properties.map((p) => p.name)).toEqual(['disabled']);
    });

    it('resolves a Mixin(...) argument reached through a barrel re-export', () => {
      const cmpFileName = '/src/components/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { Mixin } from '@stencil/core';
        import { FocusMixin } from './mixins';
        export class Checkbox extends Mixin(FocusMixin) {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const barrelCode = `export { FocusMixin } from './focus-mixin';`;
      const mixinCode = `
        import { Prop } from '@stencil/core';
        export const FocusMixin = (Base) => {
          class FocusMixinClass extends Base {
            @Prop() isFocused: boolean;
          }
          return FocusMixinClass;
        };
      `;

      const buildCtx = mockBuildCtx();

      const result = mergeExtendedClassMetaWithResolveImport(
        cmpClass,
        staticMembers,
        cmpSource,
        (specifier, importer) => {
          if (specifier === './mixins' && importer === cmpFileName) {
            return { code: barrelCode, path: '/src/components/mixins.ts' };
          }
          if (specifier === './focus-mixin' && importer === '/src/components/mixins.ts') {
            return { code: mixinCode, path: '/src/components/focus-mixin.ts' };
          }
          return null;
        },
        config,
        buildCtx,
      );

      expect(result.doesExtend).toBe(true);
      expect(result.properties.map((p) => p.name)).toEqual(['isFocused']);
      expect(buildCtx.diagnostics).toHaveLength(0);
    });

    it('does not follow a second hop through a barrel-of-a-barrel, and warns when buildCtx is supplied', () => {
      const cmpFileName = '/src/components/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { BaseInput } from './outer-barrel';
        export class Checkbox extends BaseInput {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const outerBarrelCode = `export { BaseInput } from './inner-barrel';`;
      const innerBarrelCode = `export { BaseInput } from './base-input';`;
      const baseInputCode = `
        import { Prop } from '@stencil/core';
        export class BaseInput {
          @Prop() disabled: boolean;
        }
      `;

      const buildCtx = mockBuildCtx();

      const result = mergeExtendedClassMetaWithResolveImport(
        cmpClass,
        staticMembers,
        cmpSource,
        (specifier, importer) => {
          if (specifier === './outer-barrel' && importer === cmpFileName) {
            return { code: outerBarrelCode, path: '/src/components/outer-barrel.ts' };
          }
          if (specifier === './inner-barrel' && importer === '/src/components/outer-barrel.ts') {
            return { code: innerBarrelCode, path: '/src/components/inner-barrel.ts' };
          }
          if (specifier === './base-input' && importer === '/src/components/inner-barrel.ts') {
            return { code: baseInputCode, path: '/src/components/base-input.ts' };
          }
          return null;
        },
        config,
        buildCtx,
      );

      expect(result.doesExtend).toBe(false);
      expect(result.properties).toHaveLength(0);
      expect(buildCtx.diagnostics).toHaveLength(1);
      expect(buildCtx.diagnostics[0].messageText).toContain('Unable to find "BaseInput"');
    });

    it('does not warn (or crash) when a component simply has no extends clause', () => {
      const cmpFileName = '/src/components/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `export class Checkbox {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const buildCtx = mockBuildCtx();

      const result = mergeExtendedClassMetaWithResolveImport(
        cmpClass,
        staticMembers,
        cmpSource,
        () => null,
        config,
        buildCtx,
      );

      expect(result.doesExtend).toBe(false);
      expect(buildCtx.diagnostics).toHaveLength(0);
    });
  });
});
