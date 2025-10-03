import * as ts from 'typescript';

import { getStaticGetter, transpileModule } from './transpile';

describe('parse AttrDeserialize', () => {
  it('constructs deserializers static getters', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() prop1;
        @Prop() prop2;
        @State() state1;

        @AttrDeserialize('prop1')
        @AttrDeserialize('prop2')
        onUpdate() {
          console.log('update');
        }

        @AttrDeserialize('prop1')
        @AttrDeserialize('state1')
        onStateUpdated() {
          console.log('state updated');
        }
      }
    `);

    // should not include `@State` props
    expect(getStaticGetter(t.outputText, 'deserializers')).toEqual([
      { methodName: 'onUpdate', propName: 'prop1' },
      { methodName: 'onUpdate', propName: 'prop2' },
      { methodName: 'onStateUpdated', propName: 'prop1' },
    ]);
  });

  it('should merge extended class deserializers meta', async () => {
    const t = transpileModule(
      `
      @Component({tag: 'cmp-a'})
      class CmpA extends Parent {
        @Prop() foo;
        @AttrDeserialize('foo') 
        fooHandler() {
          return 'CmpA';
        }
      }
      class Parent extends GrandParent {
        @Prop() foo;
        @AttrDeserialize('foo') 
        anotherFooHandler() {
          return 'Parent';
        }
      }
      class GrandParent {
        @Prop() bar;
        @AttrDeserialize('bar') 
        barHandler() {
          return 'GrandParent';
        }

        @Prop() foo;
        @AttrDeserialize('foo') 
        fooHandler() {
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

    expect(t.deserializers).toEqual([
      {
        methodName: 'barHandler',
        propName: 'bar',
      },
      {
        methodName: 'anotherFooHandler',
        propName: 'foo',
      },
      {
        methodName: 'fooHandler',
        propName: 'foo',
      },
    ]);
  });
});
