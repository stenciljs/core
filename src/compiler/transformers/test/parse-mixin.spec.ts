import * as ts from 'typescript';

import { transpileModule, transpileModules } from './transpile';
// import { c, formatCode } from './utils';

describe('parse mixin', () => {
  it('merges mixin class meta', () => {
    const t = transpileModule(
      `
      @Component({tag: 'cmp-a'})
      class CmpA extends Mixin(ParentWrap, GrandParentWrap) {
        @Method() async fooMethod(): string {
          return 'CmpA';
        }
        @Prop() fooProp: string = 'cmp a foo';
      }
     
      const ParentWrap = (Base) => {
        class Parent extends Base {
          @Method() async fooMethod(): string[] {
            return ['Parent'];
          }
          @Prop() fooProp: string = 'parent foo';
          @Prop() barProp: string = 'parent bar';
        }
        return Parent;
      }

      function GrandParentWrap(Base) {
        class GrandParent extends Base {
          @Method() async barMethod(): string {
            return 'GrandParent';
          }
          @Prop() barProp: string = 'grandparent bar';
          @Prop() bazProp: string = 'grandparent baz';
        }
        return GrandParent;
      }

    `,
      undefined,
      undefined,
      [],
      [],
      [],
      { target: ts.ScriptTarget.ESNext },
    );

    expect(t.methods).toEqual([
      {
        complexType: {
          parameters: [],
          references: {},
          return: 'string',
          signature: '() => string',
        },
        docs: {
          tags: [],
          text: '',
        },
        internal: false,
        name: 'barMethod',
      },
      {
        complexType: {
          parameters: [],
          references: {},
          return: 'string',
          signature: '() => string',
        },
        docs: {
          tags: [],
          text: '',
        },
        internal: false,
        name: 'fooMethod',
      },
    ]);

    expect(t.properties).toEqual([
      {
        attribute: 'baz-prop',
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
        name: 'bazProp',
        optional: false,
        reflect: false,
        required: false,
        setter: false,
        type: 'string',
      },
      {
        attribute: 'bar-prop',
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
        name: 'barProp',
        optional: false,
        reflect: false,
        required: false,
        setter: false,
        type: 'string',
      },
      {
        attribute: 'foo-prop',
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
        name: 'fooProp',
        optional: false,
        reflect: false,
        required: false,
        setter: false,
        type: 'string',
      },
    ]);
  });

  describe('mixin factory imported from a barrel index file', () => {
    it('does not emit a warning when the mixin factory is re-exported via `export * from`', () => {
      // The component imports the factory from a barrel index file:
      //   import { colorFactory } from '../mixins';        ← resolves to mixins/index.ts
      // The barrel only contains `export * from './color'` — it has no direct declaration.
      // Before the fix this triggered: "Unable to find 'colorFactory' in the imported module".
      expect(() =>
        transpileModules(
          {
            'component.tsx': `
              import { Component, Prop, h, Mixin } from '@stencil/core';
              import { colorFactory } from 'mixins/index.ts';

              const ColorMixin = colorFactory;

              @Component({ tag: 'my-cmp' })
              class MyCmp extends Mixin(ColorMixin) {
                @Prop() ownProp: string = 'own';
              }
            `,
            'mixins/index.ts': `
              export * from './color';
            `,
            'mixins/color.ts': `
              import type { MixedInCtor } from '@stencil/core';

              export const colorFactory = <B extends MixedInCtor>(Base: B) => {
                class ColorMixin extends Base {
                  @Prop() color: string = 'red';
                }
                return ColorMixin;
              };
            `,
          },
          null,
          { target: ts.ScriptTarget.ES2022 },
        ),
      ).not.toThrow();
    });

    it('does not emit a warning when the mixin factory is re-exported via named `export { X } from`', () => {
      expect(() =>
        transpileModules(
          {
            'component.tsx': `
              import { Component, Prop, h, Mixin } from '@stencil/core';
              import { myColorFactory } from 'mixins/index.ts';

              const ColorMixin = myColorFactory;

              @Component({ tag: 'my-cmp' })
              class MyCmp extends Mixin(ColorMixin) {
                @Prop() ownProp: string = 'own';
              }
            `,
            'mixins/index.ts': `
              export { colorFactory as myColorFactory } from './color';
            `,
            'mixins/color.ts': `
              import type { MixedInCtor } from '@stencil/core';

              export const colorFactory = <B extends MixedInCtor>(Base: B) => {
                class ColorMixin extends Base {
                  @Prop() color: string = 'red';
                }
                return ColorMixin;
              };
            `,
          },
          null,
          { target: ts.ScriptTarget.ES2022 },
        ),
      ).not.toThrow();
    });

    it('does not emit a warning when useDefineForClassFields is explicitly false', () => {
      // When `useDefineForClassFields: false`, TypeScript does not emit class field
      // initializers, so Stencil's `detectModernPropDeclarations` always returns false
      // for this config. The warning must be suppressed in this case because
      // `useDefineForClassFields: false` is the safe / correct Stencil configuration
      // and the inheritance works correctly at runtime.
      expect(() =>
        transpileModules(
          {
            'component.tsx': `
              import { Component, Prop, h, Mixin } from '@stencil/core';
              import { colorFactory } from 'mixins/index.ts';

              const ColorMixin = colorFactory;

              @Component({ tag: 'my-cmp' })
              class MyCmp extends Mixin(ColorMixin) {
                @Prop() ownProp: string = 'own';
              }
            `,
            'mixins/index.ts': `
              export * from './color';
            `,
            'mixins/color.ts': `
              import type { MixedInCtor } from '@stencil/core';

              export const colorFactory = <B extends MixedInCtor>(Base: B) => {
                class ColorMixin extends Base {
                  @Prop() color: string = 'red';
                }
                return ColorMixin;
              };
            `,
          },
          null,
          { target: ts.ScriptTarget.ES2022, useDefineForClassFields: false },
        ),
      ).not.toThrow();
    });
  });
});
