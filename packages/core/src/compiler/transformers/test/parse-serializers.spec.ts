import * as ts from 'typescript';

import { getStaticGetter, transpileModule } from './transpile';

describe('parse PropSerialize', () => {
  it('constructs serializers static getters', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() prop1;
        @Prop() prop2;
        @State() state1;

        @PropSerialize('prop1')
        @PropSerialize('prop2')
        onUpdate() {
          console.log('update');
        }

        @PropSerialize('prop1')
        @PropSerialize('state1')
        onStateUpdated() {
          console.log('state updated');
        }
      }
    `);

    // should not include `@State` props
    expect(getStaticGetter(t.outputText, 'serializers')).toEqual([
      { methodName: 'onUpdate', propName: 'prop1' },
      { methodName: 'onUpdate', propName: 'prop2' },
      { methodName: 'onStateUpdated', propName: 'prop1' },
    ]);
  });

  it('should merge extended class serializers meta', async () => {
    const t = transpileModule(
      `
      @Component({tag: 'cmp-a'})
      class CmpA extends Parent {
        @Prop() foo;
        @PropSerialize('foo') 
        fooHandler() {
          return 'CmpA';
        }
      }
      class Parent extends GrandParent {
        @Prop() foo;
        @PropSerialize('foo') 
        anotherFooHandler() {
          return 'Parent';
        }
      }
      class GrandParent {
        @Prop() bar;
        @PropSerialize('bar') 
        barHandler() {
          return 'GrandParent';
        }

        @Prop() foo;
        @PropSerialize('foo') 
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

    expect(t.serializers).toEqual([
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
