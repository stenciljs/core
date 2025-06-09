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
});
