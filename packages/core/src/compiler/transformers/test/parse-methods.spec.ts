import * as ts from 'typescript';

import { getStaticGetter, transpileModule } from './transpile';

describe('parse methods', () => {
  it('methods', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        /**
         * @param foo bar
         * @param bar foo
         */
        @Method()
        someMethod(foo: string, bar: number) {

        }
      }
    `);

    const someMethod = {
      complexType: {
        parameters: [
          {
            name: 'foo',
            type: 'string',
            docs: 'bar',
          },
          {
            name: 'bar',
            type: 'number',
            docs: 'foo',
          },
        ],
        return: 'void',
        references: {},
        signature: '(foo: string, bar: number) => void',
      },
      docs: {
        text: '',
        tags: [
          {
            name: 'param',
            text: 'foo bar',
          },
          {
            name: 'param',
            text: 'bar foo',
          },
        ],
      },
    };
    expect(getStaticGetter(t.outputText, 'methods')).toEqual({ someMethod });
    expect(t.method).toEqual({
      ...someMethod,
      internal: false,
      name: 'someMethod',
    });
  });

  it('should merge extended class method meta', async () => {
    const t = transpileModule(
      `
      @Component({tag: 'cmp-a'})
      class CmpA extends Parent {
        @Method() async foo(): string {
          return 'CmpA';
        }
      }
      class Parent extends GrandParent {
        @Method() async foo(): string[] {
          return ['Parent'];
        }
      }
      class GrandParent {
        @Method() async bar(): string {
          return 'GrandParent';
        }
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
        name: 'bar',
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
        name: 'foo',
      },
    ]);
  });
});
