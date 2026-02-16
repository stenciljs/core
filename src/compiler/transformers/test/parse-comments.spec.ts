import { transpileModule } from './transpile';

describe('parse comments', () => {
  it('should parse all comments', () => {
    const t = transpileModule(`
      /**
       * Comments
       * @usage Hello
       */
      @Component({
        tag: 'cmp-a'
      })
      export class CmpA {
        /**
         * This is a prop
         * @required hello
         */
        @Prop() prop: 'md';

        /**
         * This is a method
         */
        @Method()
        async method(prop: string) {
          return 42;
        }

        /**
         * This is an event
         */
        @Event() event;
      }
    `);

    expect(t.property).toEqual({
      attribute: 'prop',
      complexType: {
        references: {},
        resolved: '"md"',
        original: "'md'",
      },
      defaultValue: undefined,
      docs: {
        tags: [
          {
            name: 'required',
            text: 'hello',
          },
        ],
        text: 'This is a prop',
      },
      internal: false,
      mutable: false,
      name: 'prop',
      optional: false,
      reflect: false,
      required: false,
      type: 'string',
      getter: false,
      setter: false,
    });
    expect(t.method).toEqual({
      complexType: {
        parameters: [
          {
            name: 'prop',
            type: 'string',
            docs: '',
          },
        ],
        return: 'unknown',
        references: {},
        signature: '(prop: string) => unknown',
      },
      docs: {
        tags: [],
        text: 'This is a method',
      },
      internal: false,
      name: 'method',
    });
    expect(t.event).toEqual({
      bubbles: true,
      cancelable: true,
      composed: true,
      docs: {
        tags: [],
        text: 'This is an event',
      },
      complexType: {
        original: 'any',
        references: {},
        resolved: 'any',
      },
      internal: false,
      method: 'event',
      name: 'event',
    });
    expect(t.cmp.docs).toEqual({
      tags: [
        {
          name: 'usage',
          text: 'Hello',
        },
      ],
      text: 'Comments',
    });
  });
});
