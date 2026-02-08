import * as ts from 'typescript';

import { transpileModule } from './transpile';
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
});
