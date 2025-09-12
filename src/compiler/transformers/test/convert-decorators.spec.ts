import * as ts from 'typescript';

import { filterDecorators } from '../decorators-to-static/convert-decorators';
import { getStaticGetter, transpileModule } from './transpile';
import { c, formatCode } from './utils';

describe('convert-decorators', () => {
  it('should convert `@Prop` class fields to properties', async () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string = "initial value";
      }
    `);

    // we test the whole output here to ensure that the field has been
    // removed from the class body correctly and replaced with an initializer
    // in the constructor
    expect(await formatCode(t.outputText)).toBe(
      await c`export class CmpA {
        constructor() {
          this.val = "initial value";
        }
        static get is() {
          return "cmp-a";
        }
        static get properties() {
          return {
            "val": {
              "type": "string",
              attribute: 'val',
              "mutable": false,
              "complexType": { "original": "string", "resolved": "string", "references": {} },
              "required": false,
              "optional": false,
              "docs": { "tags": [], "text": "" },
              "getter": false, 
              "setter": false,
              "reflect": false,
              "defaultValue": "\\"initial value\\""
            }
          };
        }}`,
    );
  });

  it('should get the correct literal for a computed property enum used for a `@Prop`', async () => {
    const t = transpileModule(`
      enum MyEnum {
        MY_PROP = 'myVal'
      }
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() [MyEnum.MY_PROP]: string;
      }
    `);

    expect(t.properties).toEqual([
      {
        name: 'myVal',
        type: 'string',
        attribute: 'my-val',
        reflect: false,
        mutable: false,
        required: false,
        optional: false,
        defaultValue: undefined,
        complexType: { original: 'string', resolved: 'string', references: {} },
        docs: { tags: [], text: '' },
        internal: false,
        getter: false,
        setter: false,
      },
    ]);
  });

  it('should get the correct literal for a computed property variable used for a `@Prop`', async () => {
    const t = transpileModule(`
      const tmp = 'myVal';
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() [tmp]: string;
      }
    `);

    expect(t.properties).toEqual([
      {
        name: 'myVal',
        type: 'string',
        attribute: 'my-val',
        reflect: false,
        mutable: false,
        required: false,
        optional: false,
        defaultValue: undefined,
        complexType: { original: 'string', resolved: 'string', references: {} },
        docs: { tags: [], text: '' },
        internal: false,
        getter: false,
        setter: false,
      },
    ]);
  });

  it('should convert `@State` class fields to properties', async () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-b'})
      export class CmpB {
        @State() count: number = 0;
      }
    `);

    // we test the whole output here to ensure that the field has been
    // removed from the class body correctly and replaced with an initializer
    // in the constructor
    expect(await formatCode(t.outputText)).toBe(
      await c`export class CmpB {
        constructor() {
          this.count = 0;
        }
        static get is() {
          return "cmp-b";
        }
        static get states() {
          return { "count": {}};
        }}`,
    );
  });

  it('should get the correct literal for a computed property enum used for a `@State`', async () => {
    const t = transpileModule(`
      enum MyEnum {
        MY_PROP = 'myVal'
      }
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @State() [MyEnum.MY_PROP]: string;
      }
    `);

    expect(t.states).toEqual([
      {
        name: 'myVal',
      },
    ]);
  });

  it('should get the correct literal for a computed property variable used for a `@State`', async () => {
    const t = transpileModule(`
      const tmp = 'myVal';
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @State() [tmp]: string;
      }
    `);

    expect(t.states).toEqual([
      {
        name: 'myVal',
      },
    ]);
  });

  it('should not add a constructor if no class fields are present', async () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {
      }
    `);

    // we test the whole output here to ensure that the field has been
    // removed from the class body correctly and replaced with an initializer
    // in the constructor
    expect(await formatCode(t.outputText)).toBe(
      await c`export class CmpA {
        static get is() {
          return "cmp-a";
        }}`,
    );
  });

  it('should add a super call to the constructor if necessary', async () => {
    const t = transpileModule(
      `@Component({tag: 'cmp-a'})
      export class CmpA extends Foobar {
        @State() count: number = 0;
      }
    `,
    );

    expect(await formatCode(t.outputText)).toBe(
      await c`export class CmpA extends Foobar {
        constructor() {
          this.count = 0;
          super();
        }
        static get is() {
          return 'cmp-a';
        }
        static get states() {
          return { "count": {} };
        }}`,
    );
  });

  it('should preserve statements in an existing constructor', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'my-component',
    })
    export class MyComponent {
      constructor() {
        console.log('boop');
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      await c`export class MyComponent {
        constructor() {
          console.log('boop');
        }
        static get is() {
          return "my-component";
      }}`,
    );
  });

  it('should preserve statements in an existing constructor w/ @Prop', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'my-component',
    })
    export class MyComponent {
      @Prop() count: number;

      constructor() {
        console.log('boop');
      }
    }`);

    expect(await formatCode(t.outputText)).toContain(
      `  constructor() {
    console.log('boop');
  }`,
    );
  });

  it('should allow user to initialize field in an existing constructor w/ @Prop', async () => {
    const t = transpileModule(
      `@Component({
      tag: 'my-component',
    })
    export class MyComponent {
      @Prop() count: number;

      constructor() {
        this.count = 3;
      }
    }`,
    );

    // the initialization we do to `undefined` (since no value is present)
    // should be before the user's `this.count = 3` to ensure that their code
    // wins.
    expect(await formatCode(t.outputText)).toContain(
      `  constructor() {
    this.count = 3;
  }`,
    );
  });

  it('should preserve statements in an existing constructor w/ non-decorated field', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'example-tag',
    })
    export class Example implements FooBar {
      private classProps: Array<string>;

      constructor() {
        this.classProps = ["variant", "theme"];
      }
    }`);

    expect(await formatCode(t.outputText)).toBe(
      await c`export class Example {
        constructor() {
          this.classProps = ["variant", "theme"];
        }
        static get is() {
          return 'example-tag';
        }
      }`,
    );
  });

  it('should preserve statements in an existing constructor super, decorated field', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'example-tag',
    })
    export class Example extends Parent {
      @Prop() foo: string = "bar";

      constructor() {
        console.log("hello!")
      }
    }`);

    expect(await formatCode(t.outputText)).toContain(
      `  constructor() {
    this.foo = 'bar';
    super();
    console.log('hello!');
  }`,
    );
  });

  it('should not add a super call to the constructor if not necessary', async () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA implements Foobar {
        @State() count: number = 0;
      }
    `);

    expect(await formatCode(await formatCode(t.outputText))).toBe(
      await c`export class CmpA {
        constructor() {
          this.count = 0;
        }
        static get is() {
          return "cmp-a";
        }
        static get states() {
          return { "count": {} };
        }}`,
    );
  });

  it('should not convert `@Event` fields to constructor-initialization', async () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      export class CmpA {

      @Event({
        eventName: 'my-event-with-options',
        bubbles: false,
        cancelable: false,
      })
      myEventWithOptions: EventEmitter<{ mph: number }>;
    }
    `);

    // we test the whole output here to ensure that the field has been
    // removed from the class body correctly and replaced with an initializer
    // in the constructor
    expect(await formatCode(t.outputText)).toBe(
      await c`export class CmpA {
        static get is() {
          return "cmp-a";
        }
        static get events() {
          return [{
            "method": "myEventWithOptions",
            "name": "my-event-with-options",
            "bubbles": false,
            "cancelable": false,
            "composed": true,
            "docs": { "tags": [], "text": "" },
            "complexType": { "original": "{ mph: number }", "resolved": "{ mph: number; }", "references": {} }
          }];
      }}`,
    );
  });

  it('should create formAssociated static getter', async () => {
    const t = transpileModule(`
     @Component({
       tag: 'cmp-a',
       formAssociated: true
     })
      export class CmpA {
    }
    `);

    expect(getStaticGetter(t.outputText, 'formAssociated')).toBe(true);
  });

  it('should support formAssociated with shadow', async () => {
    const t = transpileModule(`
     @Component({
       tag: 'cmp-a',
       formAssociated: true,
       shadow: true
     })
      export class CmpA {
    }
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toBe('shadow');
    expect(getStaticGetter(t.outputText, 'formAssociated')).toBe(true);
  });

  it('should support formAssociated with scoped', async () => {
    const t = transpileModule(`
     @Component({
       tag: 'cmp-a',
       formAssociated: true,
       scoped: true
     })
      export class CmpA {
    }
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toBe('scoped');
    expect(getStaticGetter(t.outputText, 'formAssociated')).toBe(true);
  });

  it('should create attachInternalsMemberName static getter', async () => {
    const t = transpileModule(`
     @Component({
       tag: 'cmp-a',
     })
      export class CmpA {
      @AttachInternals()
      elementInternals;
    }
    `);
    expect(getStaticGetter(t.outputText, 'attachInternalsMemberName')).toBe('elementInternals');
  });

  describe('filterDecorators', () => {
    it.each<ReadonlyArray<ReadonlyArray<string>>>([[[]], [['ExcludedDecorator']]])(
      'returns undefined when no decorators are provided',
      (excludeList: ReadonlyArray<string>) => {
        const filteredDecorators = filterDecorators(undefined, excludeList);

        expect(filteredDecorators).toBeUndefined();
      },
    );

    it.each<ReadonlyArray<ReadonlyArray<string>>>([[[]], [['ExcludedDecorator']]])(
      'returns undefined for an empty list of decorators',
      (excludeList: ReadonlyArray<string>) => {
        const filteredDecorators = filterDecorators([], excludeList);

        expect(filteredDecorators).toBeUndefined();
      },
    );

    it('returns a decorator if it is not a call expression', () => {
      // create a decorator, '@Decorator'. note the lack of '()' after the decorator, making it an identifier
      // expression, rather than a call expression
      const decorator = ts.factory.createDecorator(ts.factory.createIdentifier('Decorator'));

      const filteredDecorators = filterDecorators([decorator], []);

      expect(filteredDecorators).toHaveLength(1);
      expect(filteredDecorators![0]).toBe(decorator);
    });

    it("doesn't return any decorators when all decorators in the exclude list", () => {
      // create a '@CustomProp()' decorator
      const customDecorator = ts.factory.createDecorator(
        ts.factory.createCallExpression(ts.factory.createIdentifier('CustomProp'), undefined, []),
      );
      // create '@Prop()' decorator
      const decorator = ts.factory.createDecorator(
        ts.factory.createCallExpression(ts.factory.createIdentifier('Prop'), undefined, []),
      );

      const filteredDecorators = filterDecorators([customDecorator, decorator], ['Prop', 'CustomProp']);

      expect(filteredDecorators).toBeUndefined();
    });

    it('returns any decorators not in the exclude list', () => {
      // create a '@CustomProp()' decorator
      const customDecorator = ts.factory.createDecorator(
        ts.factory.createCallExpression(ts.factory.createIdentifier('CustomProp'), undefined, []),
      );
      // create '@Prop()' decorator
      const decorator = ts.factory.createDecorator(
        ts.factory.createCallExpression(ts.factory.createIdentifier('Prop'), undefined, []),
      );

      const filteredDecorators = filterDecorators([customDecorator, decorator], ['Prop']);

      expect(filteredDecorators).toHaveLength(1);
      expect(filteredDecorators![0]).toBe(customDecorator);
    });
  });
});
